# 1. Start from a hyper-lightweight Linux distribution with Node 20 pre-installed
FROM node:20-alpine

# 2. Tell Docker that production code should be placed in the /app folder 
WORKDIR /app

# 3. Only copy package files first. This utilizes Docker "layer caching". 
# If your dependencies haven't changed, it won't redownload them!
COPY package*.json ./

# 4. Install production dependencies exclusively (ignoring dev dependencies)
RUN npm ci --omit=dev

# 5. Copy the rest of your server code into the image (this ignores things listed in .dockerignore)
COPY . .

# 6. Expose the port your Express app binds to
EXPOSE 5000

# 7. Run database migrations and start the server
CMD ["sh", "-c", "npm run migrate && npm start"]
