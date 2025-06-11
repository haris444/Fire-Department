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
 * Consolidated Login Servlet that handles authentication for all user types.
 * This servlet authenticates users against the consolidated users database table
 * and creates appropriate session attributes based on the user_type field.
 *
 * Authentication Flow:
 * - Single database lookup for all user types ('admin', 'user', 'volunteer')
 * - Creates session attributes based on user_type returned from database
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

            // Unified authentication - single database lookup for all user types
            EditUsersTable editUsersTable = new EditUsersTable();
            User user = editUsersTable.databaseToUsers(username, password);

            if (user != null) {
                // Authentication successful - create session based on user type
                HttpSession session = request.getSession(true);
                session.setAttribute("loggedInUserUsername", user.getUsername());

                // Set role-specific session attributes based on user_type
                switch (user.getUser_type()) {
                    case "admin":
                        session.setAttribute("adminUser", "true");
                        break;
                    case "user":
                        session.setAttribute("userRole", "REGULAR_USER");
                        break;
                    case "volunteer":
                        session.setAttribute("userRole", "VOLUNTEER");
                        break;
                }

                String sessionToken = session.getId();
                String message = user.getUser_type().substring(0, 1).toUpperCase() + user.getUser_type().substring(1) + " login successful";

                // Send successful login response
                sendSuccessResponse(response, sessionToken, user.getUsername(), message);
            } else {
                // Authentication failed
                sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid credentials");
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
     * Sends a successful authentication response.
     *
     * @param response The HTTP response
     * @param sessionToken The session token to include in response
     * @param username The authenticated username
     * @param message Success message
     * @throws IOException If response writing fails
     */
    private void sendSuccessResponse(HttpServletResponse response, String sessionToken,
                                     String username, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_OK);
        PrintWriter out = response.getWriter();

        // Build JSON response including username for all user types
        StringBuilder jsonResponse = new StringBuilder();
        jsonResponse.append("{\"success\": true, \"sessionToken\": \"").append(sessionToken).append("\"");
        jsonResponse.append(", \"username\": \"").append(username).append("\"");
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