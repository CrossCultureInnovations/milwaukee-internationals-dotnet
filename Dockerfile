FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build-env

WORKDIR /app/stage

RUN apk add --update nodejs npm

# Copy csproj and restore as distinct layers
COPY . .

RUN npm install && npm run build

RUN dotnet restore
RUN dotnet publish -c Release -o out

# Copy the script and styles into wwwroot
RUN cp -r client-build/* ./out/wwwroot/

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine

# QR generation
RUN apk add bash icu-libs krb5-libs libgcc libintl libssl3 libstdc++ zlib && \
    apk add libgdiplus --repository https://dl-3.alpinelinux.org/alpine/edge/testing/ --allow-untrusted 

# Timezones
RUN apk add --no-cache tzdata

WORKDIR /app/build
COPY --from=build-env "/app/stage/out" .
ENTRYPOINT ["dotnet", "API.dll"]
