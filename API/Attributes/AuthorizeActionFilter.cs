﻿using System.Reflection;
using System.Threading.Tasks;
using API.Extensions;
using Logic.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Models.Constants;

namespace API.Attributes
{
    public class AuthorizeActionFilter : IAsyncActionFilter
    {
        private readonly ISigninLogic _signinLogic;

        public AuthorizeActionFilter(ISigninLogic signinLogic)
        {
            _signinLogic = signinLogic;
        }
        
        public Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var controller = (Controller) context.Controller;
            var method = ((ControllerActionDescriptor) context.ActionDescriptor).MethodInfo;
            
            var controllerLevelAuthorize = controller.GetType().GetCustomAttribute<AuthorizeMiddlewareAttribute>();
            var actionLevelAuthorize = method.GetType().GetCustomAttribute<AuthorizeMiddlewareAttribute>();

            if (controllerLevelAuthorize == null && actionLevelAuthorize == null) return next();
            
            // Try to get username/password from session
            var (username, password) = context.HttpContext.Session.GetUseramePassword();

            if (_signinLogic.IsAuthenticated(username, password))
            {
                return next();
            }

            // Redirect to not-authenticated
            context.HttpContext.Response.Redirect("~/Singin/NotAuthenticated");

            return Task.CompletedTask;
        }
    }
}