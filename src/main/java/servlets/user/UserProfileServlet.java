package servlets.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import database.tables.EditUsersTable;
import mainClasses.User;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

public class UserProfileServlet extends BaseUserServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check user session
        if (!checkUserSession(request, response)) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Get logged in username from session
            HttpSession session = request.getSession(false);
            String loggedInUsername = (String) session.getAttribute("loggedInUserUsername");

            // Fetch user by username using the EditUsersTable method
            EditUsersTable editUsersTable = new EditUsersTable();
            User user = editUsersTable.getUserByUsernameFromDB(loggedInUsername);

            if (user != null) {
                // Convert user to JSON excluding password for security
                JsonObject userJson = new JsonObject();
                userJson.addProperty("user_id", user.getUser_id());
                userJson.addProperty("username", user.getUsername());
                userJson.addProperty("email", user.getEmail());
                userJson.addProperty("firstname", user.getFirstname());
                userJson.addProperty("lastname", user.getLastname());
                userJson.addProperty("birthdate", user.getBirthdate());
                userJson.addProperty("gender", user.getGender());
                userJson.addProperty("afm", user.getAfm());
                userJson.addProperty("country", user.getCountry());
                userJson.addProperty("address", user.getAddress());
                userJson.addProperty("municipality", user.getMunicipality());
                userJson.addProperty("prefecture", user.getPrefecture());
                userJson.addProperty("job", user.getJob());
                userJson.addProperty("telephone", user.getTelephone());
                if (user.getLat() != null) {
                    userJson.addProperty("lat", user.getLat());
                }
                if (user.getLon() != null) {
                    userJson.addProperty("lon", user.getLon());
                }

                // Send success response
                response.setStatus(HttpServletResponse.SC_OK);
                PrintWriter out = response.getWriter();
                out.print(userJson.toString());
                out.flush();
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"User not found\"}");
                out.flush();
            }

        } catch (Exception e) {
            // Handle database errors
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            PrintWriter out = response.getWriter();
            out.print("{\"success\": false, \"message\": \"Error fetching profile\"}");
            out.flush();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Check user session
        if (!checkUserSession(request, response)) {
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Get logged in username from session
            HttpSession session = request.getSession(false);
            String loggedInUsername = (String) session.getAttribute("loggedInUserUsername");

            // Read JSON payload
            StringBuilder jsonBuffer = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuffer.append(line);
            }

            // Parse JSON to User object
            Gson gson = new Gson();
            User userUpdate = gson.fromJson(jsonBuffer.toString(), User.class);

            // Create User object with logged in username and updated fields
            User userWithNewDetails = new User();
            userWithNewDetails.setUsername(loggedInUsername);
            userWithNewDetails.setFirstname(userUpdate.getFirstname());
            userWithNewDetails.setLastname(userUpdate.getLastname());
            userWithNewDetails.setBirthdate(userUpdate.getBirthdate());
            userWithNewDetails.setGender(userUpdate.getGender());
            userWithNewDetails.setAfm(userUpdate.getAfm());
            userWithNewDetails.setCountry(userUpdate.getCountry());
            userWithNewDetails.setAddress(userUpdate.getAddress());
            userWithNewDetails.setMunicipality(userUpdate.getMunicipality());
            userWithNewDetails.setPrefecture(userUpdate.getPrefecture());
            userWithNewDetails.setJob(userUpdate.getJob());
            userWithNewDetails.setTelephone(userUpdate.getTelephone());
            userWithNewDetails.setLat(userUpdate.getLat());
            userWithNewDetails.setLon(userUpdate.getLon());

            // Update user profile
            EditUsersTable editUsersTable = new EditUsersTable();
            boolean success = editUsersTable.updateUserProfile(userWithNewDetails);

            if (success) {
                response.setStatus(HttpServletResponse.SC_OK);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": true, \"message\": \"Profile updated\"}");
                out.flush();
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                PrintWriter out = response.getWriter();
                out.print("{\"success\": false, \"message\": \"Profile update failed\"}");
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
}