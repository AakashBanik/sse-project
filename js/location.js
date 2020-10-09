function ipLookUp () {
  $.getJSON('https://ipfind.co/me?auth=f2a79fdd-c584-4065-8ecd-4060964d3f5b', function(data) {
    postData(data);
  });
}

function postData(data) {
  const result = $.ajax({
    url: '/',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(data)
  });
}

ipLookUp();
  