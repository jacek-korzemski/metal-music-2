<?php 

function cli_update_channel($channel_id)
{
  if ($channel_id)
  {
    $s = new Youtube();
    echo $s->updateChannel($channel_id) . "\n";
  }
  else
  {
    echo "Missing id parameter. Make sure you typed \"--id\" insted of \"-id\", and try again. ";
  }
}

function cli_update_all_channels()
{
  $s = new Youtube();
  echo $s->updateAllChannels() . "\n";
}

function cli_update_channels_list()
{
  $s = new Youtube();
  echo $s->updateChannelsList();
}

function cli_build_channel($channel_id, $page = false)
{
  if (!$channel_id)
  {
    echo "Missing --id parameter. Make sure you typed \"--id\" insted of \"-id\", and try again. ";
    return;
  }
  $s = new Youtube();
  $result = $s->updateChannel($channel_id, $page);
  echo $result . "\n";

  $result = json_decode($result);
  if ($result->{'next-page'})
  {
    cli_build_channel($channel_id, $result->{'next-page'});
    return;
  }
  else
  {
    echo "\nIt looks like the channel has successfuly build.";
    cli_update_all_channels();
  }
}

function cli_get_videos($from, $to, $all = false)
{
  if ($all)
  {
    $s = new Youtube();
    echo $s->getAllVideos();
  }
  else if ($from && $to)
  {
    $s = new Youtube();
    echo $s->getVideos($from, $to);
  }
  else
  {
    echo "Missing parameters. Try --all to get all videos, or --from <number_1> --to <number_2> to select videos between selected IDs. ";
  }
}

function cli_get_video($id)
{
  if (!$id)
  {
    echo 'Missing --id <number> parameter.';
  }
  else
  {
    $s = new Youtube();
    echo $s->getVideo($id);
  }
}

function cli_get_channel($id)
{
  if (!$id)
  {
    echo 'Missing --id <channel_id> parameter.';
  }
  else 
  {
    $s = new Youtube();
    echo $s->getAllVideosFromChannel($id);
  }
}

function cli_get_all_channels()
{
  $s = new Youtube();
  echo $s->getAllChannels();
}

function cli_clear_database()
{
  $s = new Youtube();
  echo $s->__clearDatabaseFromTrashyRecords();
}

function cli_clear_404()
{
  $s = new Youtube();
  echo $s->__clearDatabaseFrom404Records();
}

function cli_test_url($url)
{
  if (checkUrl($url))
  {
    echo 'OK';
  }
  else
  {
    echo "FAIL";
  }
}