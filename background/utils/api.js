"use strict";
// utils/api.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRequest = apiRequest;
exports.vanaWalletApi = vanaWalletApi;
//const PRODUCTION = 'https://fastapi.kleo.network/api/v1';
var PRODUCTION = 'http://127.0.0.1:8000/api/v1';
// General API helper function
function apiRequest(method_1, endpoint_1, data_1, authToken_1) {
    return __awaiter(this, arguments, void 0, function (method, endpoint, data, authToken, baseUrl) {
        var apiEndpoint, headers, options, response, responseData, error_1;
        if (baseUrl === void 0) { baseUrl = PRODUCTION; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    apiEndpoint = "".concat(baseUrl, "/").concat(endpoint);
                    headers = {
                        'Content-Type': 'application/json',
                    };
                    if (authToken) {
                        headers['Authorization'] = "".concat(authToken);
                    }
                    options = {
                        method: method,
                        headers: headers,
                    };
                    if (data) {
                        options.body = JSON.stringify(data);
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(apiEndpoint, options)];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    responseData = _a.sent();
                    return [2 /*return*/, responseData];
                case 4:
                    error_1 = _a.sent();
                    console.error("Error in API request:", error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function vanaWalletApi(method, endpoint, authToken) {
    return __awaiter(this, void 0, void 0, function () {
        var ISLANDER_API;
        return __generator(this, function (_a) {
            ISLANDER_API = 'https://api.islander.vanascan.io/api/v2';
            return [2 /*return*/, apiRequest(method, endpoint, undefined, authToken, ISLANDER_API)];
        });
    });
}
