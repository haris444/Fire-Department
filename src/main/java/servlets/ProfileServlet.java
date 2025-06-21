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
/**
 * Universal Profile Servlet for handling user profile operations.
 * This servlet serves all user types (users and volunteers) from the consolidated users table.
 * It provides endpoints for both fetching and updating complete user profile data.
 *
 * Security: Both GET and POST operations require valid user session with REGULAR_USER or VOLUNTEER role.
 *
 * @author Mike
 */
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
            // FIX: Corrected the session attribute key from "loggedInUserUsername" to "loggedInUsername"
            String loggedInUsername = (String) session.getAttribute("loggedInUsername");

            // Fetch complete user profile from consolidated users table
            EditUsersTable editUsersTable = new EditUsersTable();
            User user = editUsersTable.getUserByUsernameFromDB(loggedInUsername);

            if (user != null) {
                // Convert complete User object to JSON (including all optional fields)
                // Password is excluded for security by not including it in the serialization
                Gson gson = new Gson();

                // Create a copy without password for security
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



    private static final Set<String> DOUBLE_FIELDS = Set.of("lat", "lon", "height", "weight");
    private static final Set<String> ALL_FIELDS = Set.of(
            "firstname", "lastname", "birthdate", "gender", "afm", "country",
            "address", "municipality", "prefecture", "job", "telephone",
            "volunteer_type", "lat", "lon", "height", "weight"
    );

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!isUserAuthenticated(request, response)) return;

        response.setContentType("application/json");

        try {
            String username = (String) request.getSession(false).getAttribute("loggedInUsername");

            // Read JSON
            StringBuilder json = new StringBuilder();
            String line;
            while ((line = request.getReader().readLine()) != null) {
                json.append(line);
            }

            // Parse and build updates
            JsonObject jsonObject = new JsonParser().parse(json.toString()).getAsJsonObject();
            Map<String, Object> updates = new HashMap<>();

            for (String field : ALL_FIELDS) {
                if (jsonObject.has(field) && !jsonObject.get(field).isJsonNull()) {
                    if (DOUBLE_FIELDS.contains(field)) {
                        updates.put(field, jsonObject.get(field).getAsDouble());
                    } else {
                        updates.put(field, jsonObject.get(field).getAsString());
                    }
                }
            }

            // Update and respond
            boolean success = !updates.isEmpty() &&
                    new EditUsersTable().updateUserProfile(username, updates);

            response.getWriter().print("{\"success\": " + success + "}");

        } catch (Exception e) {
            response.getWriter().print("{\"success\": false}");
        }
    }
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
