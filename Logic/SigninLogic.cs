﻿using System.Collections.Generic;
using System.Linq;
using Logic.Interfaces;
using static Logic.Utilities.HashingUtility;

namespace Logic
{
    public class SigninLogic : ISigninLogic
    {
        private readonly IUserLogic _userLogic;

        private readonly Dictionary<string, string> _authenticatedUsers;

        /// <summary>
        /// Constructor dependency injection
        /// </summary>
        /// <param name="userLogic"></param>
        public SigninLogic(IUserLogic userLogic)
        {
            _userLogic = userLogic;
            _authenticatedUsers = new Dictionary<string, string>();
        }

        /// <summary>
        /// Authenticates a user
        /// </summary>
        /// <param name="username"></param>
        /// <param name="password"></param>
        /// <param name="result"></param>
        public void TryLogin(string username, string password, out bool result)
        {
            // Authenticate the user
            if (_userLogic.GetAll().Any(x => x.Username == username && x.Password == SecureHashPassword(password)))
            {
                _authenticatedUsers[username] = SecureHashPassword(password);

                result = true;
            }
            else
            {
                result = false;
            }
        }

        /// <summary>
        /// Log out the user
        /// </summary>
        /// <param name="username"></param>
        /// <param name="password"></param>
        /// <param name="result"></param>
        public void TryLogout(string username, string password, out bool result)
        {
            // Authenticate the user
            if (_userLogic.GetAll().Any(x => x.Username == username && x.Password == SecureHashPassword(password)))
            {
                _authenticatedUsers.Remove(username);

                result = true;
            }
            else
            {
                result = false;
            }
        }

        /// <summary>
        /// Checks whether user is authenticated or not
        /// </summary>
        /// <param name="username"></param>
        /// <param name="password"></param>
        /// <returns></returns>
        public bool IsAuthenticated(string username, string password)
        {
            return _authenticatedUsers.Any(x => x.Key == username && x.Value == SecureHashPassword(password));
        }
    }
}