package servlets.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import database.tables.EditUsersTable;
import mainClasses.User;
import servlets.BaseServlet;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

public class AdminUsersServlet extends BaseServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check admin session
        if (!checkSession(request, response, "adminUser", "true")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Get all users summary from database
            EditUsersTable editUsersTable = new EditUsersTable();
            ArrayList<User> users = editUsersTable.getAllUsersSummary();

            // Convert to JSON
            Gson gson = new Gson();
            String jsonResponse = gson.toJson(users);

            // Send response
            response.setStatus(HttpServletResponse.SC_OK);
            PrintWriter out = response.getWriter();
            out.print(jsonResponse);
            out.flush();

        } catch (Exception e) {
            // Handle database errors
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error fetching users\"}");
            out.flush();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check admin session
        if (!checkSession(request, response, "adminUser", "true")) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Read JSON payload
            StringBuilder jsonBuffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }

            // Parse JSON
            Gson gson = new Gson();
            DeleteUserRequest deleteRequest = gson.fromJson(jsonBuffer.toString(), DeleteUserRequest.class);

            // Check if action is delete
            if ("delete".equals(deleteRequest.action)) {
                String username = deleteRequest.username;

                // Delete user from database
                EditUsersTable editUsersTable = new EditUsersTable();
                boolean success = editUsersTable.deleteUserByUsername(username);

                if (success) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    PrintWriter out = response.getWriter();
                    out.print("{\"success\": true, \"message\": \"User deleted\"}");
                    out.flush();
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    PrintWriter out = response.getWriter();
                    out.print("{\"success\": false, \"message\": \"Failed to delete user\"}");
                    out.flush();
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Invalid action\"}");
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
    private static class DeleteUserRequest {
        String action;
        String username;
    }
}