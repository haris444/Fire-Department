package database.tables;

import mainClasses.User;
import com.google.gson.Gson;
import java.util.*;
import database.DB_Connection;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author Mike
 */
public class EditUsersTable {


    public void addUserFromJSON(String json) throws ClassNotFoundException{
        User user=jsonToUser(json);
        addNewUser(user);
    }

    public User jsonToUser(String json){
        Gson gson = new Gson();

        User user = gson.fromJson(json, User.class);
        return user;
    }

    public String userToJSON(User user){
        Gson gson = new Gson();

        String json = gson.toJson(user, User.class);
        return json;
    }



    public void updateUser(String username,String key,String value) throws SQLException, ClassNotFoundException{
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        String update="UPDATE users SET "+key+"='"+value+"' WHERE username = '"+username+"'";
        stmt.executeUpdate(update);
        stmt.close();
        con.close();
    }


    public User databaseToUsers(String username, String password) throws SQLException, ClassNotFoundException{
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        ResultSet rs;
        try {
            rs = stmt.executeQuery("SELECT * FROM users WHERE username = '" + username + "' AND password='"+password+"'");
            rs.next();
            String json=DB_Connection.getResultsToJSON(rs);
            Gson gson = new Gson();
            User user = gson.fromJson(json, User.class);
            return user;
        } catch (Exception e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
        }
        return null;
    }

    public String databaseUserToJSON(String username, String password) throws SQLException, ClassNotFoundException{
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        ResultSet rs;
        try {
            rs = stmt.executeQuery("SELECT * FROM users WHERE username = '" + username + "' AND password='"+password+"'");
            rs.next();
            String json=DB_Connection.getResultsToJSON(rs);
            return json;
        } catch (Exception e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
        }
        return null;
    }

    /**
     * Retrieves all users from the database with summary information only.
     * Returns user_id, username, firstname, and lastname for each user.
     *
     * @return ArrayList<User> containing user summary objects
     * @throws SQLException
     * @throws ClassNotFoundException
     */
    public ArrayList<User> getAllUsersSummary() throws SQLException, ClassNotFoundException {
        ArrayList<User> userList = new ArrayList<User>();
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        try {
            ResultSet rs = stmt.executeQuery("SELECT user_id, username, firstname, lastname, user_type FROM users");
            while (rs.next()) {
                User user = new User();
                user.setUser_id(rs.getInt("user_id"));
                user.setUsername(rs.getString("username"));
                user.setFirstname(rs.getString("firstname"));
                user.setLastname(rs.getString("lastname"));
                user.setUser_type(rs.getString("user_type"));
                userList.add(user);
            }

        } catch (SQLException e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
        } finally {
            stmt.close();
            con.close();
        }

        return userList;
    }

    /**
     * Deletes a user from the database by username.
     *
     * @param username The username of the user to delete
     * @return true if deletion was successful, false otherwise
     * @throws SQLException
     * @throws ClassNotFoundException
     */
    public boolean deleteUserByUsername(String username) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        boolean success = false;

        try {
            String deleteQuery = "DELETE FROM users WHERE username = '" + username + "'";
            int rowsAffected = stmt.executeUpdate(deleteQuery);
            success = (rowsAffected > 0);

        } catch (SQLException e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
        } finally {
            stmt.close();
            con.close();
        }

        return success;
    }

    public void createUsersTable() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        String query = "CREATE TABLE users "
                + "(user_id INTEGER not NULL AUTO_INCREMENT, "
                + "    username VARCHAR(30) not null unique,"
                + "    email VARCHAR(50) not null unique,	"
                + "    password VARCHAR(32) not null,"
                + "    firstname VARCHAR(30) not null,"
                + "    lastname VARCHAR(30) not null,"
                + "    birthdate DATE not null,"
                + "    gender VARCHAR(7) not null,"
                + "    afm VARCHAR(10) not null,"
                + "    country VARCHAR(30) not null,"
                + "    address VARCHAR(100) not null,"
                + "    municipality VARCHAR(50) not null,"
                + "    prefecture VARCHAR(15) not null,"
                + "    job VARCHAR(200) not null,"
                + "    telephone VARCHAR(14) not null unique,"
                + "    lat DOUBLE,"
                + "    lon DOUBLE,"
                + "    user_type VARCHAR(10) not null," // type: 'admin', 'user', 'volunteer'
                + "    volunteer_type VARCHAR(10),"      //  optional
                + "    height DOUBLE,"                    //  optional
                + "    weight DOUBLE,"                    //  optional
                + " PRIMARY KEY (user_id))";
        stmt.execute(query);
        stmt.close();
    }


    /**
     * Establish a database connection and add in the database.
     * Updated to work with consolidated users table including new fields:
     * user_type, volunteer_type, height, weight
     *
     * @throws ClassNotFoundException
     */
    public void addNewUser(User user) throws ClassNotFoundException {
        try {
            Connection con = DB_Connection.getConnection();

            Statement stmt = con.createStatement();

            // Handle nullable fields - convert null values to SQL NULL
            String volunteerType = (user.getVolunteer_type() == null) ? "NULL" : "'" + user.getVolunteer_type() + "'";
            String height = (user.getHeight() == null) ? "NULL" : user.getHeight().toString();
            String weight = (user.getWeight() == null) ? "NULL" : user.getWeight().toString();

            String insertQuery = "INSERT INTO "
                    + " users (username,email,password,firstname,lastname,birthdate,gender,afm,country,address,municipality,prefecture,"
                    + "job,telephone,lat,lon,user_type,volunteer_type,height,weight)"
                    + " VALUES ("
                    + "'" + user.getUsername() + "',"
                    + "'" + user.getEmail() + "',"
                    + "'" + user.getPassword() + "',"
                    + "'" + user.getFirstname() + "',"
                    + "'" + user.getLastname() + "',"
                    + "'" + user.getBirthdate() + "',"
                    + "'" + user.getGender() + "',"
                    + "'" + user.getAfm() + "',"
                    + "'" + user.getCountry() + "',"
                    + "'" + user.getAddress() + "',"
                    + "'" + user.getMunicipality() + "',"
                    + "'" + user.getPrefecture() + "',"
                    + "'" + user.getJob() + "',"
                    + "'" + user.getTelephone() + "',"
                    + "'" + user.getLat() + "',"
                    + "'" + user.getLon() + "',"
                    + "'" + user.getUser_type() + "',"
                    + volunteerType + ","
                    + height + ","
                    + weight
                    + ")";
            //stmt.execute(table);
            System.out.println(insertQuery);
            stmt.executeUpdate(insertQuery);
            System.out.println("# The user was successfully added in the database.");

            /* Get the member id from the database and set it to the member */
            stmt.close();

        } catch (SQLException ex) {
            Logger.getLogger(EditUsersTable.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    // In EditUsersTable.java - Smart update method that only updates provided fields
    public boolean updateUserProfileSelective(String username, Map<String, Object> updates) throws SQLException, ClassNotFoundException {
        if (updates == null || updates.isEmpty()) {
            return false;
        }

        Connection con = null;
        java.sql.PreparedStatement stmt = null;
        boolean success = false;

        try {
            con = DB_Connection.getConnection();

            // Build dynamic SQL with only the fields that need updating
            StringBuilder sql = new StringBuilder("UPDATE users SET ");
            List<Object> values = new ArrayList<>();

            boolean first = true;
            for (String field : updates.keySet()) {
                if (!first) sql.append(", ");
                sql.append(field).append(" = ?");
                values.add(updates.get(field));
                first = false;
            }

            sql.append(" WHERE username = ?");
            values.add(username);

            stmt = con.prepareStatement(sql.toString());

            // Set parameters
            for (int i = 0; i < values.size(); i++) {
                Object value = values.get(i);
                if (value == null) {
                    stmt.setNull(i + 1, java.sql.Types.VARCHAR);
                } else if (value instanceof String) {
                    stmt.setString(i + 1, (String) value);
                } else if (value instanceof Double) {
                    stmt.setDouble(i + 1, (Double) value);
                } else if (value instanceof Integer) {
                    stmt.setInt(i + 1, (Integer) value);
                } else {
                    stmt.setString(i + 1, value.toString());
                }
            }

            int rowsAffected = stmt.executeUpdate();
            success = (rowsAffected > 0);

        } catch (SQLException e) {
            System.err.println("Error updating user profile: " + e.getMessage());
            throw e;
        } finally {
            if (stmt != null) stmt.close();
            if (con != null) con.close();
        }

        return success;
    }

    /**
     * Direct database query to get user by username.
     * This is a simple implementation for the school assignment.
     *
     * @param username The username to fetch
     * @return User object or null if not found
     * @throws Exception
     */
    public User getUserByUsernameFromDB(String username) throws Exception {
        database.DB_Connection dbConn = new database.DB_Connection();
        java.sql.Connection con = dbConn.getConnection();
        java.sql.Statement stmt = con.createStatement();

        try {
            java.sql.ResultSet rs = stmt.executeQuery("SELECT * FROM users WHERE username = '" + username + "'");
            if (rs.next()) {
                String json = dbConn.getResultsToJSON(rs);
                Gson gson = new Gson();
                User user = gson.fromJson(json, User.class);
                return user;
            }
        } finally {
            stmt.close();
            con.close();
        }

        return null;
    }

    public int getUserIdByUsername(String username) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        try {
            ResultSet rs = stmt.executeQuery("SELECT user_id FROM users WHERE username = '" + username + "'");
            if (rs.next()) {
                return rs.getInt("user_id");
            }
            return -1;
        } finally {
            stmt.close();
            con.close();
        }
    }

    public ArrayList<User> getAllVolunteers() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ArrayList<User> volunteers = new ArrayList<>();

        try {
            ResultSet rs = stmt.executeQuery("SELECT user_id, username, firstname, lastname FROM users WHERE user_type = 'volunteer'");
            while (rs.next()) {
                User volunteer = new User();
                volunteer.setUser_id(rs.getInt("user_id"));
                volunteer.setUsername(rs.getString("username"));
                volunteer.setFirstname(rs.getString("firstname"));
                volunteer.setLastname(rs.getString("lastname"));
                volunteers.add(volunteer);
            }
        } finally {
            stmt.close();
            con.close();
        }
        return volunteers;
    }

}