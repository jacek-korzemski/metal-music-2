<?php
function checkUrl($url) {
  if (!$url) 
  { 
    return false; 
  }

  $url = str_replace('https://', '', $url);
  $url = str_replace('http://', '', $url);

  $curl_resource = curl_init($url);

  curl_setopt($curl_resource, CURLOPT_RETURNTRANSFER, true);
  curl_exec($curl_resource);

  if(curl_getinfo($curl_resource, CURLINFO_HTTP_CODE) == "404") 
  {
    curl_close($curl_resource);
    return false;
  } 
  else
  {
    curl_close($curl_resource);
    return true;
  }

  return false;
}