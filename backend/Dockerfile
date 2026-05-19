FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY . .

# SDK 10.0.300 bug: MSBuild adds bin\Debug/** to DefaultItemExcludes and tries to enumerate
# that directory when expanding item globs. If it doesn't exist, the exception handler treats
# the include glob as a literal filename, which then fails in CSC. Creating the dir prevents this.
RUN mkdir -p WeddingInvite.API/bin/Debug WeddingInvite.API/obj/Debug

RUN dotnet publish "WeddingInvite.API/WeddingInvite.API.csproj" \
    -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir -p /app/data /app/wwwroot/uploads
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "WeddingInvite.API.dll"]
