package servlets;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import com.google.gson.Gson;
import database.tables.EditUsersTable;
import mainClasses.User;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.SQLException;

/**
 * Consolidated Login Servlet that handles authentication for both admin and regular users.
 * This servlet replaces the separate AdminLoginServlet and UserLoginServlet classes.
 *
 * Authentication Flow:
 * - If username is "admin", validates against hardcoded admin credentials
 * - Otherwise, validates against the users database table
 * - Creates appropriate session attributes based on user type
 */
public class LoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Read JSON payload from request body
            StringBuilder jsonBuffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }

            // Parse JSON using Gson
            Gson gson = new Gson();
            LoginRequest loginRequest = gson.fromJson(jsonBuffer.toString(), LoginRequest.class);

            String username = loginRequest.username;
            String password = loginRequest.password;

            // Differentiate user type based on username
            if ("admin".equals(username)) {
                // Handle admin authentication with hardcoded credentials
                handleAdminAuthentication(username, password, request, response);
            } else {
                // Handle regular user authentication via database
                handleUserAuthentication(username, password, request, response);
            }

        } catch (SQLException ex) {
            // Handle database-related errors
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Database error occurred during authentication");
        } catch (ClassNotFoundException ex) {
            // Handle missing database driver errors
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Database driver not found");
        } catch (Exception ex) {
            // Handle JSON parsing or other unexpected errors
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Error processing authentication request");
        }
    }

    /**
     * Handles authentication for admin users by validating against database credentials.
     *
     * @param username The provided username
     * @param password The provided password
     * @param request The HTTP request
     * @param response The HTTP response
     * @throws IOException If response writing fails
     * @throws SQLException If database access fails
     * @throws ClassNotFoundException If database driver is not found
     */
    private void handleAdminAuthentication(String username, String password,
                                           HttpServletRequest request, HttpServletResponse response)
            throws IOException, SQLException, ClassNotFoundException {

        // Validate admin credentials against database
        EditUsersTable editUsersTable = new EditUsersTable();
        User user = editUsersTable.databaseToUsers(username, password);

        if (user != null) {
            // Create session and set admin attributes
            HttpSession session = request.getSession(true);
            session.setAttribute("adminUser", "true");

            String sessionToken = session.getId();

            // Send successful admin login response
            sendSuccessResponse(response, sessionToken, username, "Admin login successful");
        } else {
            // Database authentication failed
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid admin credentials");
        }
    }

    /**
     * Handles authentication for regular users via database lookup.
     *
     * @param username The provided username
     * @param password The provided password
     * @param request The HTTP request
     * @param response The HTTP response
     * @throws IOException If response writing fails
     * @throws SQLException If database access fails
     * @throws ClassNotFoundException If database driver is not found
     */
    private void handleUserAuthentication(String username, String password,
                                          HttpServletRequest request, HttpServletResponse response)
            throws IOException, SQLException, ClassNotFoundException {

        // Authenticate user using database
        EditUsersTable editUsersTable = new EditUsersTable();
        User user = editUsersTable.databaseToUsers(username, password);

        if (user != null) {
            // Create session and set user attributes
            HttpSession session = request.getSession(true);
            session.setAttribute("loggedInUserUsername", user.getUsername());
            session.setAttribute("userRole", "REGULAR_USER");

            String sessionToken = session.getId();

            // Send successful user login response (includes username as per original UserLoginServlet)
            sendSuccessResponse(response, sessionToken, user.getUsername(), "User login successful");
        } else {
            // Database authentication failed
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid user credentials");
        }
    }

    /**
     * Sends a successful authentication response.
     *
     * @param response The HTTP response
     * @param sessionToken The session token to include in response
     * @param username The authenticated username (null for admin-only response)
     * @param message Success message
     * @throws IOException If response writing fails
     */
    private void sendSuccessResponse(HttpServletResponse response, String sessionToken,
                                     String username, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_OK);
        PrintWriter out = response.getWriter();

        // Build JSON response - include username for user logins, exclude for admin
        StringBuilder jsonResponse = new StringBuilder();
        jsonResponse.append("{\"success\": true, \"sessionToken\": \"").append(sessionToken).append("\"");

        if (username != null && !"admin".equals(username)) {
            jsonResponse.append(", \"username\": \"").append(username).append("\"");
        }

        jsonResponse.append(", \"message\": \"").append(message).append("\"}");

        out.print(jsonResponse.toString());
        out.flush();
    }

    /**
     * Sends an error response for failed authentication or other errors.
     *
     * @param response The HTTP response
     * @param statusCode The HTTP status code to set
     * @param message Error message
     * @throws IOException If response writing fails
     */
    private void sendErrorResponse(HttpServletResponse response, int statusCode, String message) throws IOException {
        response.setStatus(statusCode);
        PrintWriter out = response.getWriter();
        out.print("{\"success\": false, \"message\": \"" + message + "\"}");
        out.flush();
    }

    /**
     * Inner class for JSON parsing of login requests.
     * Contains the username and password fields expected in the JSON payload.
     */
    private static class LoginRequest {
        String username;
        String password;
    }
}