"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.PageStatus = exports.PostStatus = exports.UserStatus = exports.ContentStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["EDITOR"] = "editor";
    UserRole["AUTHOR"] = "author";
    UserRole["USER"] = "user";
})(UserRole || (exports.UserRole = UserRole = {}));
var ContentStatus;
(function (ContentStatus) {
    ContentStatus["DRAFT"] = "draft";
    ContentStatus["PUBLISHED"] = "published";
    ContentStatus["ARCHIVED"] = "archived";
    ContentStatus["SCHEDULED"] = "scheduled";
})(ContentStatus || (exports.ContentStatus = ContentStatus = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING"] = "pending";
    UserStatus["APPROVED"] = "approved";
    UserStatus["REJECTED"] = "rejected";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var PostStatus;
(function (PostStatus) {
    PostStatus["DRAFT"] = "draft";
    PostStatus["PUBLISHED"] = "published";
    PostStatus["SCHEDULED"] = "scheduled";
    PostStatus["ARCHIVED"] = "archived";
})(PostStatus || (exports.PostStatus = PostStatus = {}));
var PageStatus;
(function (PageStatus) {
    PageStatus["DRAFT"] = "draft";
    PageStatus["PUBLISHED"] = "published";
    PageStatus["ARCHIVED"] = "archived";
})(PageStatus || (exports.PageStatus = PageStatus = {}));
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCodes["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorCodes["AUTHORIZATION_ERROR"] = "AUTHORIZATION_ERROR";
    ErrorCodes["NOT_FOUND"] = "NOT_FOUND";
    ErrorCodes["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCodes["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ErrorCodes["INVALID_INPUT"] = "INVALID_INPUT";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
//# sourceMappingURL=index.js.map