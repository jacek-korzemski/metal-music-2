<?php 

use Engine\src\Db;

class Youtube
{
  protected $db;
  protected $key;

  public function __construct()
  {
    if (isset($_SERVER['YOUTUBE_API_KEY']))
    {
      $this->key  = $_SERVER['YOUTUBE_API_KEY'];
      $this->db   = new Db();
    }
    else
    {
      throw new Error ('There is no Youtube api key declared in .env file, or the .env file is not readable.');
      exit;
    }
  }

  public function updateAllChannels($debug = false)
  {
    $counter_before = $this->db->query('SELECT COUNT(*) FROM `music`;')->fetchArray()['COUNT(*)'];
    $channels_list = $this->db->query('SELECT * FROM `channels`')->fetchAll();
    foreach ($channels_list as $channel)
    {
      if ($debug) 
      {
        echo $this->updateChannel($channel['id'], false, true);
      } else 
      {        
        $this->updateChannel($channel['id'], false, true);
      }
    }
    $counter_after = $this->db->query('SELECT COUNT(*) FROM `music`;')->fetchArray()['COUNT(*)'];
    $counter = $counter_after - $counter_before;
    return '{"code": 200, "status": "success", "message": "Channels updated successfully.", "newRecords": '.$counter.'}';
  }

  public function updateChannel($channel_id, $next_page = false)
  {
    $real_id = $this->db->query("SELECT * FROM `channels` WHERE id = \"$channel_id\"")->fetchAll()[0]["channel_id"];
    $data = $this->getChannelData($real_id, $next_page);
    if (!is_object($data)) {
      echo "data:" . $data." \n";
      return;
    }
    $query = 'INSERT IGNORE INTO `music` (
      `id`, 
      `channel_id`, 
      `video_id`, 
      `title`, 
      `url`, 
      `published_at`, 
      `default_thumbnail`, 
      `medium_thumbnail`, 
      `high_thumbnail`, 
      `channel_title`,
      `hide`) 
      VALUES ';

    if ($data && $data->items)
    {
      foreach ($data->items as $item)
      {
        if (checkUrl($item->snippet->thumbnails->medium->url))
        {
          $set_hide = "NULL";
        }
        else {
          $set_hide = "1";
        }
        if (isset($item) && isset($item->id) && isset($item->id->videoId))
        {
          $query.= '(
            NULL, 
            \''. preg_replace("/'/i", "|", $item->snippet->channelId) .'\', 
            \''. preg_replace("/'/i", "|", $item->id->videoId) .'\', 
            \''. preg_replace("/'/i", "|", $item->snippet->title) .'\', 
            \''. preg_replace("/'/i", "|", $item->id->videoId) .'\', 
            \''. preg_replace("/'/i", "|", $item->snippet->publishedAt) .'\', 
            \''. preg_replace("/'/i", "|", $item->snippet->thumbnails->default->url) .'\', 
            \''. preg_replace("/'/i", "|", $item->snippet->thumbnails->medium->url) .'\', 
            \''. preg_replace("/'/i", "|", $item->snippet->thumbnails->high->url) .'\', 
            \''. preg_replace("/'/i", "|", $item->snippet->channelTitle) .'\',
            '.$set_hide.')';
        }
        if(!next($data->items)) 
        {
          $query.= ';';
        }
        else
        {
          $query.= ', ';
        }

        $query = preg_replace("/, ;/i", ";", $query);
        $query = preg_replace("/, ,/i", ",", $query);
      }
      $this->db->query($query);
      if (isset($data) && isset($data->nextPageToken)) {
        return '{"code": 200, "status": "success", "message": "update success", "next-page": "'.$data->nextPageToken.'"}';
      }
      return '{"code": 200, "status": "success", "message": "update success", "next-page": null}';
    }
  }

  public function updateChannelsList()
  {
    $this->db->query('
      INSERT IGNORE INTO `channels` (channel_id, channel_title) SELECT 
      channel_id, channel_title FROM `music` GROUP BY
      channel_id, channel_title HAVING COUNT(*) > 1;
    ');
    return '{"code": 200, "status": "success", "message": "Channels list updated"}';
  }

  public function getAllVideos()
  {
    $videos = $this->db->query('SELECT * FROM `music`;')->fetchAll();
    return '{"code": 200, "status": "success", "message": "Successfully fetched all videos". "items": '.$this->buildJsonResponse($videos).'}';
  }

  public function getAllVideosFromChannel($channel)
  {
    $videos = $this->db->query("SELECT * FROM `music` WHERE channel_id = \"$channel\";")->fetchAll();
    return '{"code": 200, "status": "success", "message": "Successfully fetched all videos from channel with id: '.$channel.'.", "items": '.$this->buildJsonResponse($videos).'}';
  }

  public function getVideos($from, $to)
  {
    $videos = $this->db->query("SELECT * FROM `music` WHERE `id` BETWEEN $from and $to")->fetchAll();
    return '{"code": 200, "status": "success", "message": "Successfully fetched all videos from id: '.$from.' to id: '.$to.'", "items": '.$this->buildJsonResponse($videos).'}';
  }

  public function getVideo($id)
  {
    $video = $this->db->query("SELECT * FROM `music` WHERE `id` = $id")->fetchAll();
    if (is_array($video))
    {
      return '{"code": 200, "status": "success", "message": "Successfully fetched video data with id: '.$id.'", "video": '.json_encode($video).'}';
    }
    else
    {
      return '{"code": 404, "status": "error", "message": "Video with id: '.$id.' does not exist.", "video": '.json_encode($video).'}';
    }
  }

  public function getAllChannels()
  {
    $channels = $this->db->query("SELECT * FROM `channels`")->fetchAll();
    return '{"code": 200, "status": "success", "message": "Successfully fetched all channels data.", "channels": '.$this->buildJsonResponse($channels).'}';
  }

  public function __clearDatabaseFromTrashyRecords()
  {
    $channels = $this->db->query("SELECT * FROM `channels`")->fetchAll();
    $query    = 'DELETE FROM `music` WHERE channel_id NOT IN (';

    foreach ($channels as $channel)
    {
      $query .= '"'.$channel['channel_id'].'"';
      if (next($channels))
      {
        $query .= ",";
      }
    }

    $query .= "); \n";
    $this->db->query($query);
    echo "Deleted records: " . $this->db->affectedRows();
  }

  public function __clearDatabaseFrom404Records()
  {
    $videos = $this->db->query("SELECT * FROM `music`")->fetchAll();

    foreach ($videos as $video)
    {
      if (!checkUrl($video['default_thumbnail']))
      {
        $delete_counter++;
        $this->db->query('UPDATE `music` SET hide = 1 WHERE id = '. $video['id']);
        echo $video['id'] . " - is now hidden \n";
      }
      if (checkUrl($video['default_thumbnail']))
      {
        $restore_counter++;
        $this->db->query('UPDATE `music` SET hide = NULL WHERE id = '. $video['id']);
        echo $video['id'] . " - is now visible \n";
      }
    }
    echo "deleted: $delete_counter records. \n restored: $restore_counter records. \n";
  }

  private function getChannelData($channel_id, $next_page = false)
  {
    $options = array(
      'order' => 'date', 
      'part' => 'snippet',
      'channelId' => $channel_id,
      'maxResults' => 50,
      'key' => $this->key
    );
    if ($next_page)
    {
      $options['pageToken'] = $next_page;
    }
    $url = "https://www.googleapis.com/youtube/v3/search?".http_build_query($options, 'a', '&');
    $curl = curl_init($url);

    curl_setopt($curl, CURLOPT_HTTPAUTH, CURLAUTH_ANY);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);  
    curl_setopt($curl, CURLOPT_REFERER, "http://katalog.metalmusic.pl");

    $json_response = curl_exec($curl);

    curl_close($curl);
    
    $result = json_decode($json_response);

    if ($result)
    { 
      return $result; 
    }
    else
    { 
      error_log(date('Y-m-d h:i') . " - The API key is used enough for today. Try again tomorow. \n", 3, __DIR__ . "/../../logs/errors.log");
      return '{"code": 500, "status": "error", "message": "It seems, that your API key is used enough for today. Try again tomorow.", "next-page": null, "result": "'.$result.'"}';
    }
  }

  private function buildJsonResponse($array)
  {
    $result  = "";
    $result .= "[";
    foreach ($array as $item)
    {
      $result .= json_encode($item);
      if (next($array))
      {
        $result .= ", \n";
      }
    }
    $result .= "]";
    return $result;
  }
}