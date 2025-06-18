package servlets;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import com.google.gson.Gson;
import database.tables.EditUsersTable;
import mainClasses.User;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonElement;
import java.util.*;

public class ProfileServlet extends BaseServlet {

    /**
     * Handles profile data retrieval for authenticated users.
     * Returns the complete User object including all fields (basic + volunteer-specific).
     * The frontend will determine which fields to display based on user_type.
     *
     * @param request HTTP request containing user session
     * @param response HTTP response with complete user profile data in JSON format
     * @throws IOException if response writing fails
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check user session - allow both REGULAR_USER and VOLUNTEER roles
        if (!isUserAuthenticated(request, response)) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Get logged in username from session
            HttpSession session = request.getSession(false);

            String loggedInUsername = (String) session.getAttribute("loggedInUsername");


            EditUsersTable editUsersTable = new EditUsersTable();
            User user = editUsersTable.getUserByUsernameFromDB(loggedInUsername);

            if (user != null) {
                // Convert complete User object to JSON (including all optional fields)
                // Password is excluded for security by not including it in the serialization
                Gson gson = new Gson();


                User userForResponse = new User();
                userForResponse.setUser_id(user.getUser_id());
                userForResponse.setUsername(user.getUsername());
                userForResponse.setEmail(user.getEmail());
                userForResponse.setFirstname(user.getFirstname());
                userForResponse.setLastname(user.getLastname());
                userForResponse.setBirthdate(user.getBirthdate());
                userForResponse.setGender(user.getGender());
                userForResponse.setAfm(user.getAfm());
                userForResponse.setCountry(user.getCountry());
                userForResponse.setAddress(user.getAddress());
                userForResponse.setMunicipality(user.getMunicipality());
                userForResponse.setPrefecture(user.getPrefecture());
                userForResponse.setJob(user.getJob());
                userForResponse.setTelephone(user.getTelephone());
                userForResponse.setLat(user.getLat());
                userForResponse.setLon(user.getLon());
                userForResponse.setUser_type(user.getUser_type());
                userForResponse.setVolunteer_type(user.getVolunteer_type());
                userForResponse.setHeight(user.getHeight());
                userForResponse.setWeight(user.getWeight());

                String userJson = gson.toJson(userForResponse);

                // Send success response with complete user data
                response.setStatus(HttpServletResponse.SC_OK);
                PrintWriter out = response.getWriter();
                out.print(userJson);
                out.flush();
            } else {
                // User not found in database
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"User profile not found for username: " + loggedInUsername + "\"}");
                out.flush();
            }

        } catch (Exception e) {
            // Handle database or other errors
            System.err.println("Error fetching user profile: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error fetching profile data\"}");
            out.flush();
        }
    }

    /**
     * Handles profile data updates for authenticated users.
     * Accepts complete User object in JSON format and updates all fields in the database.
     * Supports updating both basic user fields and optional volunteer-specific fields.
     *
     * @param request HTTP request containing JSON payload with updated user data
     * @param response HTTP response with operation status
     * @throws IOException if response writing fails
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!isUserAuthenticated(request, response)) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            HttpSession session = request.getSession(false);
            String loggedInUsername = (String) session.getAttribute("loggedInUsername");

            // Read JSON payload
            StringBuilder jsonBuffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }

            // Parse JSON and build update map
            JsonObject jsonObject = new JsonParser().parse(jsonBuffer.toString()).getAsJsonObject();
            Map<String, Object> updates = new HashMap<>();

            // Define allowed fields for security
            Set<String> allowedFields = Set.of(
                    "firstname", "lastname", "birthdate", "gender", "afm",
                    "country", "address", "municipality", "prefecture",
                    "job", "telephone", "lat", "lon",
                    "volunteer_type", "height", "weight"
            );

            // Extract only allowed fields that are present in JSON
            for (String field : allowedFields) {
                if (jsonObject.has(field)) {
                    JsonElement element = jsonObject.get(field);
                    if (element.isJsonNull()) {
                        updates.put(field, null);
                    } else {
                        switch (field) {
                            case "lat":
                            case "lon":
                            case "height":
                            case "weight":
                                updates.put(field, element.getAsDouble());
                                break;
                            default:
                                updates.put(field, element.getAsString());
                        }
                    }
                }
            }

            if (updates.isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"No valid fields to update\"}");
                out.flush();
                return;
            }

            // Update only the provided fields
            EditUsersTable editUsersTable = new EditUsersTable();
            boolean success = editUsersTable.updateUserProfileSelective(loggedInUsername, updates);

            if (success) {
                response.setStatus(HttpServletResponse.SC_OK);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": true, \"message\": \"Profile updated successfully\"}");
                out.flush();
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Profile update failed\"}");
                out.flush();
            }

        } catch (Exception e) {
            System.err.println("Error updating user profile: " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error processing profile update\"}");
            out.flush();
        }
    }

    /**
     * Helper method to check if user is authenticated with proper role.
     * Verifies user session and allows access for both REGULAR_USER and VOLUNTEER roles.
     *
     * @param request HTTP request to check session
     * @param response HTTP response for sending unauthorized errors
     * @return true if user is authenticated with valid role, false otherwise
     * @throws IOException if response writing fails
     */
    private boolean isUserAuthenticated(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);

        if (session == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"No active session. Please login.\"}");
            out.flush();
            return false;
        }

        String userRole = (String) session.getAttribute("userRole");

        if ("REGULAR_USER".equals(userRole) || "VOLUNTEER".equals(userRole)) {
            return true;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        PrintWriter out = response.getWriter();
        out.print("{\"success\": false, \"message\": \"Access denied. Insufficient privileges.\"}");
        out.flush();
        return false;
    }
}
