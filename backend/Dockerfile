FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files first so restore is cached separately
COPY WeddingInvite.Models/WeddingInvite.Models.csproj WeddingInvite.Models/
COPY WeddingInvite.Data/WeddingInvite.Data.csproj WeddingInvite.Data/
COPY WeddingInvite.Core/WeddingInvite.Core.csproj WeddingInvite.Core/
COPY WeddingInvite.API/WeddingInvite.API.csproj WeddingInvite.API/
RUN dotnet restore "WeddingInvite.API/WeddingInvite.API.csproj"

# Copy source and publish
COPY . .
RUN dotnet publish "WeddingInvite.API/WeddingInvite.API.csproj" \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/data /app/wwwroot/uploads
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "WeddingInvite.API.dll"]
