# Dockerfile - serve the static site with nginx
FROM nginx:stable-alpine
COPY ./ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
