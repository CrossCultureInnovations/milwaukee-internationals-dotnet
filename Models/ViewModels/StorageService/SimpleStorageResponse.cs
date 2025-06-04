using System.Net;

namespace Models.ViewModels.StorageService;

public class SimpleStorageResponse(HttpStatusCode status, string message)
{
    public HttpStatusCode Status { get; } = status;

    public string Message { get; } = message;
}