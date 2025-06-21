package database.tables;

import mainClasses.User;
import com.google.gson.Gson;

import java.sql.*;
import java.util.*;
import database.DB_Connection;

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


    public User userFromCredentials(String username, String password) throws SQLException, ClassNotFoundException{
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
            System.err.println(e.getMessage());
        }
        return null;
    }

    // Retrieves users from database basic info only
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
            System.err.println(e.getMessage());
        } finally {
            stmt.close();
            con.close();
        }

        return userList;
    }


    public boolean deleteUserByUsername(String username) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        boolean success = false;

        try {
            String deleteQuery = "DELETE FROM users WHERE username = '" + username + "'";
            int rowsAffected = stmt.executeUpdate(deleteQuery);
            success = (rowsAffected > 0);

        } catch (SQLException e) {
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
        stmt.close();
        con.close();
    }



    public void addNewUser(User user) throws ClassNotFoundException {
        try {
            Connection con = DB_Connection.getConnection();

            String insertQuery = "INSERT INTO users (username,email,password,firstname,lastname,birthdate,gender,afm,country,address,municipality,prefecture,job,telephone,lat,lon,user_type,volunteer_type,height,weight) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

            PreparedStatement pstmt = con.prepareStatement(insertQuery);

            pstmt.setString(1, user.getUsername());
            pstmt.setString(2, user.getEmail());
            pstmt.setString(3, user.getPassword());
            pstmt.setString(4, user.getFirstname());
            pstmt.setString(5, user.getLastname());
            pstmt.setString(6, user.getBirthdate());
            pstmt.setString(7, user.getGender());
            pstmt.setString(8, user.getAfm());
            pstmt.setString(9, user.getCountry());
            pstmt.setString(10, user.getAddress());
            pstmt.setString(11, user.getMunicipality());
            pstmt.setString(12, user.getPrefecture());
            pstmt.setString(13, user.getJob());
            pstmt.setString(14, user.getTelephone());
            pstmt.setDouble(15, user.getLat());
            pstmt.setDouble(16, user.getLon());
            pstmt.setString(17, user.getUser_type());
            pstmt.setString(18, user.getVolunteer_type());
            pstmt.setObject(19, user.getHeight());
            pstmt.setObject(20, user.getWeight());

            pstmt.executeUpdate();
            System.out.println("# The user was successfully added in the database.");

            pstmt.close();

        } catch (SQLException ex) {
            Logger.getLogger(EditUsersTable.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    //Todo explain later
    public boolean updateUserProfile(String username, Map<String, Object> updates) throws SQLException, ClassNotFoundException {
        try (Connection con = DB_Connection.getConnection()) {
            StringBuilder sql = new StringBuilder("UPDATE users SET ");

            boolean first = true;
            for (String field : updates.keySet()) {
                if (!first) sql.append(", ");
                sql.append(field).append(" = ?");
                first = false;
            }
            sql.append(" WHERE username = ?");

            try (PreparedStatement stmt = con.prepareStatement(sql.toString())) {
                int i = 1;
                for (Object value : updates.values()) {
                    if (value instanceof Double) {
                        stmt.setDouble(i++, (Double) value);
                    } else {
                        stmt.setString(i++, (String) value);
                    }
                }
                stmt.setString(i, username);

                return stmt.executeUpdate() > 0;
            }
        }
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