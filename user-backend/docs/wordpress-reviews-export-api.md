# WordPress — eksport recenzji (API)

Ten dokument opisuje chroniony endpoint HTTP zwracający ostatnie recenzje z backendu aplikacji (model `Review`). Można go wykorzystać do zaimplementowania importu po stronie WordPressa (np. w motywie, `functions.php`, wtyczce lub zadaniu cron).

**Ważne:** Dostęp wymaga sekretu skonfigurowanego tylko na serwerze produkcyjnym (`WORDPRESS_EXPORT_API_KEY` w `.env`). Bez poprawnego klucza endpoint zwraca `401` lub `503`; nie udostępniaj klucza w repozytorium ani w kodzie frontu.

## Środowiska (referencja)

| Rola | Przykładowy host |
|------|------------------|
| API aplikacji (ten backend) | `https://auth.metalmusic.pl` |
| Blog WordPress | `https://metalmusic.pl` |

Zastąp host swoim wdrożeniem; ścieżki API są względem **root URL** backendu.

## Base URL

Wszystkie ścieżki poniżej są pod prefiksem Laravel API: **`{APP_URL}/api`**.

Przykład: jeśli `APP_URL=https://auth.metalmusic.pl`, pełny URL eksportu to:

`https://auth.metalmusic.pl/api/exports/reviews`

## Uwierzytelnianie

Klucz musi być **identyczny** z wartością `WORDPRESS_EXPORT_API_KEY` ustawioną na serwerze Laravel (generuj długi, losowy sekret).

Przekaż go **jednym** z nagłówków:

1. **`X-API-Key: <sekret>`** (preferowane dla prostych klientów)
2. **`Authorization: Bearer <sekret>`**

Brak nagłówka, pusty klucz lub niezgodny sekret → **`401`** z ciałem JSON: `{ "message": "Unauthorized" }`.

Jeśli na serwerze **nie** ustawiono `WORDPRESS_EXPORT_API_KEY` (pusta konfiguracja) → **`503`** z: `{ "message": "Export not configured" }`.

## Endpoint

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| `GET` | `/exports/reviews` | Do **50** ostatnich recenzji wg `updated_at` malejąco |

Brak parametrów query; brak paginacji (stała lista 50 pozycji). **Nie są zwracane** rekordy z `skip_export = true` (ustawiane w aplikacji przez administratora — „pomiń export”).

## Odpowiedź sukcesu (`200`)

Ciało: **tablica JSON** obiektów. Każdy element:

| Pole | Typ | Opis |
|------|-----|------|
| `id` | integer | Identyfikator recenzji w bazie aplikacji (użyj go jako stabilnego klucza po stronie WordPress — meta posta / custom field). |
| `title` | string \| null | Tytuł powiązany z utworem (`song_title` w DB); może być `null`. |
| `content` | string | Treść recenzji jako **HTML** (pole `content_html` w DB). Importuj do `post_content` lub najpierw oczyść/filtruj po swojej stronie. |
| `updated_at` | string (ISO 8601) | Ostatnia modyfikacja; przydatne do synchronizacji przyrostowej i wykrywania zmian. |

### Przykład (fragment)

```json
[
  {
    "id": 12,
    "title": "Band Name — Track Title",
    "content": "<p>Recenzja w HTML…</p>",
    "updated_at": "2026-03-20T14:30:00.000000Z"
  }
]
```

## Przykład wywołania (`curl`)

```bash
curl -sS \
  -H "X-API-Key: YOUR_SECRET_HERE" \
  "https://auth.metalmusic.pl/api/exports/reviews"
```

Alternatywa z Bearer:

```bash
curl -sS \
  -H "Authorization: Bearer YOUR_SECRET_HERE" \
  "https://auth.metalmusic.pl/api/exports/reviews"
```

## Wskazówki dla importu do WordPressa

1. **HTML:** `content` jest gotowym fragmentem HTML — typowo wstawiasz go do treści wpisu; rozważ `wp_kses_post()` lub własny dozwolony zestaw tagów.
2. **Duplikaty:** przy imporcie zapisuj mapowanie `id` (z API) → ID posta WordPress (np. meta `_metal_review_id`), żeby przy kolejnym imporcie zaktualizować ten sam wpis zamiast tworzyć duplikat.
3. **Data publikacji:** zdecyduj w motywie / opcji wtyczki: czy użyć daty z WordPressa, daty `updated_at` z API, czy innej logiki — API udostępnia `updated_at`; data utworzenia pierwotna w aplikacji jest w modelu jako `created_at`, ale **nie** jest w tej odpowiedzi; jeśli potrzebujesz jej w imporcie, rozszerz endpoint osobną zmianą backendu.
4. **Wywołania:** typowo **serwer do serwera** (PHP WordPressa, WP-Cron, ręczny przycisk w panelu). Wywołania z przeglądarki użytkownika wymagałyby dodatkowego CORS — obecnie integracja jest zakładana po stronie serwera WordPress (ten sam fizyczny serwer Apache z inną subdomeną nie zmienia tej zalecanej praktyki bezpieczeństwa).
5. **Ręczny vs harmonogram:** implementacja (np. w `functions.php` motywu) może oferować: import na żądanie, zaplanowany import, lub per-recenzja — API zawsze zwraca tę samą listę „ostatnie 50”; logika „co już zaimportowano” należy do WordPressa.

## Podsumowanie kodów HTTP

| Kod | Znaczenie |
|-----|-----------|
| `200` | Poprawny klucz; ciało: tablica recenzji (może być pusta `[]`). |
| `401` | Brak lub nieprawidłowy klucz. |
| `503` | Eksport wyłączony — brak skonfigurowanego klucza na serwerze API. |
