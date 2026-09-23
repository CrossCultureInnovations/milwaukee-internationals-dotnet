# Milwaukee-Internationals

[Website URL](https://milwaukee-internationals-core.herokuapp.com)

Re-write of back-end using ~.NET core ^3.1~ .NET 6

- Swagger UI for API documentation
- Entity Framework for Data Access Layer
- SQLite for the local environment and Postgres for the production environment
- ~AWS.S3 for storing of global configs~
- Azure Blob for storing of global configs
- Mailjet for mass email
- `Microsoft.AspNet.Identity.Core` for authentication and authorization
- Azure table storage for daily API events
- SignalR for live API event monitoring

Notes:
- Make sure you have the .NET Core SDK installed ([Download](https://www.microsoft.com/net/learn/get-started))
- Configure the Cap server URL, site key, and secret from the website's Configuration page before accepting public registrations.
- To view environment variables make sure to install `heroku cli` and then
  - `heroku config --json --app="milwaukee-internationals-core"`

--- 

This project started in 2017 to manage a annual tour of Milwaukee.
