package servlets;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import database.tables.EditUsersTable;
import database.tables.CheckForDuplicatesExample;
import mainClasses.User;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

public class UnifiedRegisterServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            System.out.println("UnifiedRegisterServlet: doPost called");

            // Read JSON payload from request body
            StringBuilder jsonBuffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }

            System.out.println("Received JSON: " + jsonBuffer.toString());

            // Parse JSON to get registrationType first
            JsonParser parser = new JsonParser();
            JsonObject jsonObject = parser.parse(jsonBuffer.toString()).getAsJsonObject();

            if (!jsonObject.has("registrationType")) {
                System.out.println("Missing registrationType field");
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Registration type is required");
                return;
            }

            String registrationType = jsonObject.get("registrationType").getAsString();
            System.out.println("Registration type: " + registrationType);

            // Validate registration type
            if (!"user".equals(registrationType) && !"volunteer".equals(registrationType)) {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Invalid registration type. Must be 'user' or 'volunteer'");
                return;
            }


            Gson gson = new Gson();
            User user = gson.fromJson(jsonBuffer.toString(), User.class);


            user.setUser_type(registrationType);


            CheckForDuplicatesExample duplicateChecker = new CheckForDuplicatesExample();
            boolean usernameAvailable = duplicateChecker.isUserNameAvailable(user.getUsername());
            boolean emailAvailable = duplicateChecker.isEmailAvailable(user.getEmail());

            if (!usernameAvailable || !emailAvailable) {
                sendErrorResponse(response, HttpServletResponse.SC_CONFLICT,
                        "Username or email already exists.");
                return;
            }


            EditUsersTable editUsersTable = new EditUsersTable();
            editUsersTable.addNewUser(user);


            String message = registrationType.substring(0, 1).toUpperCase() + registrationType.substring(1) + " registration successful. Please login.";
            sendSuccessResponse(response, message);

        } catch (Exception e) {
            System.err.println("Error in UnifiedRegisterServlet: " + e.getMessage());
            e.printStackTrace();
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Registration failed. Please try again.");
        }
    }

    private void sendSuccessResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_CREATED);
        PrintWriter out = response.getWriter();
        out.print("{\"success\": true, \"message\": \"" + message + "\"}");
        out.flush();
    }

    private void sendErrorResponse(HttpServletResponse response, int statusCode, String message) throws IOException {
        response.setStatus(statusCode);
        PrintWriter out = response.getWriter();
        out.print("{\"success\": false, \"message\": \"" + message + "\"}");
        out.flush();
    }
}