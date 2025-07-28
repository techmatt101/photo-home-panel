# Production stage - assumes project is already built
FROM nginx:alpine

# Copy pre-built files from local dist directory
COPY dist/ /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
