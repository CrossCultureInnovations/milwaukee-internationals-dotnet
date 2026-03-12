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
RUN apk add --no-cache tzdata

WORKDIR /app/build
COPY --from=build-env "/app/stage/out" .
ENTRYPOINT ["dotnet", "API.dll"]
