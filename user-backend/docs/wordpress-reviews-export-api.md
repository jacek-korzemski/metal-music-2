# WordPress — eksport recenzji (API)

Ten dokument opisuje chroniony endpoint HTTP zwracający ostatnie recenzje z backendu aplikacji (model `Review`). Można go wykorzystać do zaimplementowania importu po stronie WordPressa (np. w motywie, `functions.php`, wtyczce lub zadaniu cron).

**Dla implementacji w osobnym repozytorium WordPressa:** ten plik jest **jedynym źródłem kontraktu** HTTP (ścieżka, nagłówki, pola JSON, zachowanie przy `null`). Nie trzeba czytać kodu Laravel, aby poprawnie zaimportować treść i grafikę wyróżniającą.

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
| `video_id` | string \| null | Identyfikator filmu YouTube zapisany przy recenzji (do meta / debugowania). **Nie buduj** po stronie WordPressa własnych URL-i miniatur z tego pola — użyj wyłącznie `featured_image_url`. |
| `featured_image_url` | string \| null | **Jeden** gotowy URL HTTPS do miniatury (obraz JPEG na CDN YouTube). Backend wybiera najlepszy dostępny wariant (`maxresdefault` → `sddefault` → `hqdefault`) przez sprawdzenie po swojej stronie. Jeśli brak zapisanego `video_id` w recenzji albo żaden wariant nie jest dostępny — `null`. |
| `category_slug` | string | **Slug jednej kategorii** wpisu w WordPressie, w której ma się znaleźć zaimportowana recenzja (np. `recenzje`). Wartość jest powtarzana w każdym elemencie tablicy; domyślnie po stronie Laravel: `recenzje` (nadpisanie przez `WORDPRESS_EXPORT_CATEGORY_SLUG` w `.env`). Importer **nie powinien** dodawać innych kategorii (w szczególności domyślnej „inne”), patrz sekcja poniżej. |

### Kategoria wpisu (tylko „recenzje”, bez „inne”)

Importowane recenzje muszą trafiać **wyłącznie** do kategorii o slugu `category_slug` z odpowiedzi API (typowo `recenzje`). Jeśli wpis dostaje jednocześnie kategorię „recenzje” i „inne”, zwykle przyczyną jest **domyślna kategoria** WordPressa lub **doklejanie** kolejnej kategorii zamiast **zastąpienia** listy kategorii.

1. Po utworzeniu lub zaktualizowaniu wpisu ustaw kategorie tak, aby **została tylko** kategoria o slugu `category_slug`:
   - `wp_set_object_terms( $post_id, [ $term_id_recenzje ], 'category', false );` — czwarty argument **`false`** oznacza *zastąp* przypisania, a nie dopisz (zapobiega pozostawieniu domyślnej kategorii obok „recenzje”).
   - Albo: `wp_set_post_categories( $post_id, [ $term_id_recenzje ], false );` — trzeci argument **`false`** = zastąp listę kategorii.
2. Przy `wp_insert_post()` **nie** ustawiaj `post_category` na tablicę zawierającą ID domyślnej kategorii („inne”) **or** ID „recenzje” — ustaw **tylko** ID terminu dla slugu `category_slug`. Najbezpieczniej: utwórz wpis, potem jednym wywołaniem z pkt. 1 przypisz wyłącznie `recenzje`.
3. Upewnij się, że w WordPressie istnieje kategoria o slugu zgodnym z `category_slug` (np. **Wpisy → Kategorie** — slug `recenzje`).

### Import grafiki wyróżniającej (featured image)

1. **Nie wywołuj** YouTube Data API ani nie składaj samodzielnie adresów `img.youtube.com/vi/.../maxresdefault.jpg` itd. — logika wyboru wariantu jest **wyłącznie w backendzie** aplikacji.
2. Gdy `featured_image_url` jest **niepustym stringiem**, pobierz obrazek **jednym** żądaniem HTTP GET do tego URL (np. w PHP: `download_url()` z WordPressa, potem `media_handle_sideload()` / `set_post_thumbnail()` albo odpowiednik w Twojej wtyczce).
3. Gdy `featured_image_url` jest **`null`**, pomiń ustawianie miniatury wpisu albo użyj domyślnego obrazka motywu — decyzja po stronie WordPressa; API tylko informuje, że nie ma grafiki do importu.

### Przykład (fragment)

```json
[
  {
    "id": 12,
    "title": "Band Name — Track Title",
    "content": "<p>Recenzja w HTML…</p>",
    "updated_at": "2026-03-20T14:30:00.000000Z",
    "video_id": "dQw4w9WgXcQ",
    "featured_image_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "category_slug": "recenzje"
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
6. **Kategorie:** patrz sekcja **„Kategoria wpisu (tylko „recenzje”, bez „inne”)”** powyżej — zawsze **zastępuj** przypisanie kategorii (`false` w `wp_set_object_terms` / `wp_set_post_categories`), żeby uniknąć pary „recenzje” + „inne”.

## Podsumowanie kodów HTTP

| Kod | Znaczenie |
|-----|-----------|
| `200` | Poprawny klucz; ciało: tablica recenzji (może być pusta `[]`). |
| `401` | Brak lub nieprawidłowy klucz. |
| `503` | Eksport wyłączony — brak skonfigurowanego klucza na serwerze API. |
