docker push aakash123/sse
docker push registry.heroku.com/$HEROKU_APP/web
heroku config:set REDIS_PROVIDER=REDISCLOUD_URL
heroku container:release web --app $HEROKU_APP