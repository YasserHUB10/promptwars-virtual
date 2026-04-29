FROM nginx:1.25-alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy BEP static files
COPY index.html /usr/share/nginx/html/
COPY script.js  /usr/share/nginx/html/
COPY style.css  /usr/share/nginx/html/

# Cloud Run requires PORT env — override nginx to listen on $PORT (default 8080)
RUN sed -i 's/listen\s*80;/listen 8080;/' /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
