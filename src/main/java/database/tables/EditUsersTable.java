/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package database.tables;

import mainClasses.User;
import com.google.gson.Gson;
import mainClasses.User;
import database.DB_Connection;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;
import mainClasses.Participant;

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
            ResultSet rs = stmt.executeQuery("SELECT user_id, username, firstname, lastname FROM users");

            while (rs.next()) {
                User user = new User();
                user.setUser_id(rs.getInt("user_id"));
                user.setUsername(rs.getString("username"));
                user.setFirstname(rs.getString("firstname"));
                user.setLastname(rs.getString("lastname"));
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
                + "    gender  VARCHAR (7) not null,"
                + "    afm  VARCHAR (10) not null,"
                + "    country VARCHAR(30) not null,"
                + "    address VARCHAR(100) not null,"
                + "    municipality VARCHAR(50) not null,"
                + "    prefecture VARCHAR(15) not null,"
                + "    job VARCHAR(200) not null,"
                + "    telephone VARCHAR(14) not null unique,"
                + "    lat DOUBLE,"
                + "    lon DOUBLE,"
                + " PRIMARY KEY (user_id))";
        stmt.execute(query);
        stmt.close();
    }


    /**
     * Establish a database connection and add in the database.
     *
     * @throws ClassNotFoundException
     */
    public void addNewUser(User user) throws ClassNotFoundException {
        try {
            Connection con = DB_Connection.getConnection();

            Statement stmt = con.createStatement();

            String insertQuery = "INSERT INTO "
                    + " users (username,email,password,firstname,lastname,birthdate,gender,afm,country,address,municipality,prefecture,"
                    + "job,telephone,lat,lon)"
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
                    + "'" + user.getLon() + "'"
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



}