
FROM nginx:alpine

COPY . /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT [ "/bin/sh", "/usr/share/nginx/html/entrypoint.sh" ]