package servlets;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import com.google.gson.Gson;
import com.google.gson.JsonObject; // Import JsonObject for cleaner JSON building
import database.tables.EditUsersTable;
import mainClasses.User;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.SQLException;

/**
 * Consolidated Login Servlet (Refactored)
 *
 * This servlet handles authentication for all user types and has been updated
 * to return the 'user_type' in the success response, allowing the frontend
 * to redirect to the correct dashboard.
 */
public class LoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Read JSON payload from request body
            StringBuilder jsonBuffer = new StringBuilder();
            try (BufferedReader reader = request.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) {
                    jsonBuffer.append(line);
                }
            }

            Gson gson = new Gson();
            LoginRequest loginRequest = gson.fromJson(jsonBuffer.toString(), LoginRequest.class);

            String username = loginRequest.username;
            String password = loginRequest.password;

            // Unified authentication for all user types
            EditUsersTable editUsersTable = new EditUsersTable();
            User user = editUsersTable.databaseToUsers(username, password);

            if (user != null) {
                // Authentication successful
                HttpSession session = request.getSession(true);
                session.setAttribute("loggedInUsername", user.getUsername());

                // Set role-specific session attributes
                switch (user.getUser_type()) {
                    case "admin":
                        session.setAttribute("adminUser", "true");
                        break;
                    case "volunteer":
                        session.setAttribute("userRole", "VOLUNTEER");
                        break;
                    default: // "user"
                        session.setAttribute("userRole", "REGULAR_USER");
                        break;
                }

                String message = user.getUser_type().substring(0, 1).toUpperCase() + user.getUser_type().substring(1) + " login successful";

                // MODIFIED: Pass the user_type to the success response method
                sendSuccessResponse(response, session.getId(), user.getUsername(), user.getUser_type(), message);
            } else {
                // Authentication failed
                sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid user credentials");
            }

        } catch (SQLException | ClassNotFoundException ex) {
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Database error during authentication");
        } catch (Exception ex) {
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error processing authentication request");
        }
    }

    /**
     * Sends a successful authentication response, now including the user_type.
     *
     * @param response The HTTP response
     * @param sessionToken The session token to include in response
     * @param username The authenticated username
     * @param userType The type of user ('admin', 'user', 'volunteer')
     * @param message Success message
     * @throws IOException If response writing fails
     */
    private void sendSuccessResponse(HttpServletResponse response, String sessionToken,
                                     String username, String userType, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_OK);

        // Use JsonObject for cleaner and more reliable JSON creation
        JsonObject jsonResponse = new JsonObject();
        jsonResponse.addProperty("success", true);
        jsonResponse.addProperty("sessionToken", sessionToken);
        jsonResponse.addProperty("username", username);
        jsonResponse.addProperty("user_type", userType); // CRITICAL: Add user_type to the response
        jsonResponse.addProperty("message", message);

        try (PrintWriter out = response.getWriter()) {
            out.print(jsonResponse.toString());
        }
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

        JsonObject jsonResponse = new JsonObject();
        jsonResponse.addProperty("success", false);
        jsonResponse.addProperty("message", message);

        try (PrintWriter out = response.getWriter()) {
            out.print(jsonResponse.toString());
        }
    }

    /**
     * Inner class for JSON parsing of login requests.
     */
    private static class LoginRequest {
        String username;
        String password;
    }
}