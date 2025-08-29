using DAL.Extensions;
using Models.Utilities;
using Npgsql;

namespace DAL.Utilities;

public static class ConnectionStringUtility
{
    /// <summary>
    /// Converts connection string url to resource
    /// </summary>
    /// <param name="connectionStringUrl"></param>
    /// <returns></returns>
    public static string ConnectionStringUrlToPgResource(string connectionStringUrl)
    {
        var (_, table) = UrlUtility.UrlToResource(connectionStringUrl);

        if (!table.ContainKeys("Host", "Username", "Password", "Database", "ApplicationName"))
        {
            return string.Empty;
        }

        if (!int.TryParse(table["Port"], out var port) || port <= 0)
        {
            port = 5432;
        }
            
        var connectionStringBuilder = new NpgsqlConnectionStringBuilder
        {
            Host = table["Host"],
            Username = table["Username"],
            Password = table["Password"],
            Database = table["Database"],
            ApplicationName = table["ApplicationName"],
            SslMode = SslMode.Prefer,
            Pooling = true,
            // Hard limit
            MaxPoolSize = 5,
            Port = port,
            CommandTimeout = 0
        };

        return connectionStringBuilder.ToString();
    }
}