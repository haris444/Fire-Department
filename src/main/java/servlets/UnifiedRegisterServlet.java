package servlets;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import database.tables.EditUsersTable;
import database.tables.EditVolunteersTable;
import database.tables.CheckForDuplicatesExample;
import mainClasses.User;
import mainClasses.Volunteer;
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

            // Parse JSON to get registrationType
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

            if ("user".equals(registrationType)) {
                handleUserRegistration(jsonBuffer.toString(), response);
            } else if ("volunteer".equals(registrationType)) {
                handleVolunteerRegistration(jsonBuffer.toString(), response);
            } else {
                sendErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Invalid registration type. Must be 'user' or 'volunteer'");
            }

        } catch (Exception e) {
            System.err.println("Error in UnifiedRegisterServlet: " + e.getMessage());
            e.printStackTrace();
            sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Registration failed. Please try again.");
        }
    }

    private void handleUserRegistration(String jsonString, HttpServletResponse response) throws Exception {
        // Parse JSON to User object
        Gson gson = new Gson();
        User user = gson.fromJson(jsonString, User.class);

        // Check for duplicates
        CheckForDuplicatesExample duplicateChecker = new CheckForDuplicatesExample();
        boolean usernameAvailable = duplicateChecker.isUserNameAvailable(user.getUsername());
        boolean emailAvailable = duplicateChecker.isEmailAvailable(user.getEmail());

        if (!usernameAvailable || !emailAvailable) {
            sendErrorResponse(response, HttpServletResponse.SC_CONFLICT,
                    "Username or email already exists.");
            return;
        }

        // Register the user
        EditUsersTable editUsersTable = new EditUsersTable();
        editUsersTable.addNewUser(user);

        // Send success response
        sendSuccessResponse(response, "User registration successful. Please login.");
    }

    private void handleVolunteerRegistration(String jsonString, HttpServletResponse response) throws Exception {
        // Parse JSON to Volunteer object
        Gson gson = new Gson();
        Volunteer volunteer = gson.fromJson(jsonString, Volunteer.class);

        // Check for duplicates
        CheckForDuplicatesExample duplicateChecker = new CheckForDuplicatesExample();
        boolean usernameAvailable = duplicateChecker.isUserNameAvailable(volunteer.getUsername());
        boolean emailAvailable = duplicateChecker.isEmailAvailable(volunteer.getEmail());

        if (!usernameAvailable || !emailAvailable) {
            sendErrorResponse(response, HttpServletResponse.SC_CONFLICT,
                    "Username or email already exists.");
            return;
        }

        // Register the volunteer
        EditVolunteersTable editVolunteersTable = new EditVolunteersTable();
        editVolunteersTable.addNewVolunteer(volunteer);

        // Send success response
        sendSuccessResponse(response, "Volunteer registration successful. Please login.");
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