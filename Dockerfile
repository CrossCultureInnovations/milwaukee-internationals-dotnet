FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build-env

WORKDIR /app/stage

RUN apk add --update nodejs npm

# Copy csproj and restore as distinct layers
COPY . .

RUN npm install && npm run build

# Build React SPA
WORKDIR /app/stage/web
RUN npm install && npm run build

WORKDIR /app/stage
RUN dotnet restore
RUN dotnet publish -c Release -o out

# Copy the old script/styles into wwwroot (SPA already built into wwwroot/spa by Vite)
RUN cp -r client-build/* ./out/wwwroot/

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine

# Timezones
RUN apk add --no-cache tzdata curl

WORKDIR /app/build
COPY --from=build-env "/app/stage/out" .

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
	CMD curl --fail --silent --show-error "http://127.0.0.1:${PORT:-5005}/api/health" > /dev/null || exit 1

ENTRYPOINT ["dotnet", "API.dll"]
