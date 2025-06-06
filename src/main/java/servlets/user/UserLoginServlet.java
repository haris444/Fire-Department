package servlets.user;

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

public class UserLoginServlet extends HttpServlet {

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

            // Authenticate user using EditUsersTable
            EditUsersTable editUsersTable = new EditUsersTable();
            User user = editUsersTable.databaseToUsers(username, password);

            // Check if authentication is successful
            if (user != null) {
                // Create or get existing session
                HttpSession session = request.getSession(true);
                session.setAttribute("loggedInUserUsername", user.getUsername());
                session.setAttribute("userRole", "REGULAR_USER");

                String sessionToken = session.getId();

                // Send success response
                response.setStatus(HttpServletResponse.SC_OK);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": true, \"sessionToken\": \"" + sessionToken + "\", \"username\": \"" + user.getUsername() + "\", \"message\": \"Login successful\"}");
                out.flush();
            } else {
                // Send authentication failure response
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Invalid credentials\"}");
                out.flush();
            }

        } catch (Exception e) {
            // Handle JSON parsing or database errors
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error processing request\"}");
            out.flush();
        }
    }

    // Inner class for JSON parsing
    private static class LoginRequest {
        String username;
        String password;
    }
}