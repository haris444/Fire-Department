package servlets;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import com.google.gson.Gson;
import com.google.gson.JsonObject; // Import JsonObject for cleaner JSON building
import database.tables.UsersTable;
import mainClasses.User;
import java.io.IOException;
import java.io.PrintWriter;

/**
 * Consolidated Login Servlet for all types of users
 * This servlet handles authentication for all user types and returns
 * the 'user_type' in the success response, allowing the frontend
 * to redirect to the correct dashboard.
 */
public class LoginServlet extends BaseServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            String jsonString = getJSONFromAjax(request.getReader());

            Gson gson = new Gson();
            LoginRequest loginRequest = gson.fromJson(jsonString, LoginRequest.class);

            String username = loginRequest.username;
            String password = loginRequest.password;

            UsersTable usersTable = new UsersTable();
            User user = usersTable.getUserByUsername(username);

            if (user != null && user.getPassword().equals(password)) {

                HttpSession session = request.getSession(true);
                session.setAttribute("loggedInUsername", user.getUsername());

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

                sendSuccessResponse(response, session.getId(), user.getUsername(), user.getUser_type());
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_OK, "Invalid user credentials");
            }

        } catch (Exception ex) {
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error processing authentication request");
        }
    }


    private void sendSuccessResponse(HttpServletResponse response, String sessionToken,
                                     String username, String userType) throws IOException {

        response.setStatus(HttpServletResponse.SC_OK);
        JsonObject jsonResponse = new JsonObject();
        jsonResponse.addProperty("success", true);
        jsonResponse.addProperty("sessionToken", sessionToken);
        jsonResponse.addProperty("username", username);
        jsonResponse.addProperty("user_type", userType);

        try (PrintWriter out = response.getWriter()) {
            out.print(jsonResponse.toString());
        }
    }


    private void sendErrorResponse(HttpServletResponse response, int statusCode, String message) throws IOException {
        response.setStatus(statusCode);

        JsonObject jsonResponse = new JsonObject();
        jsonResponse.addProperty("success", false);
        jsonResponse.addProperty("message", message);

        try (PrintWriter out = response.getWriter()) {
            out.print(jsonResponse.toString());
        }
    }

    private static class LoginRequest {
        String username;
        String password;
    }
}