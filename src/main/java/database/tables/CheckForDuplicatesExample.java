package database.tables;

import com.google.gson.Gson;
import database.DB_Connection;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import mainClasses.User;


public class CheckForDuplicatesExample {

    public boolean isUserNameAvailable(String username) throws SQLException, ClassNotFoundException{
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        ResultSet rs;
        try {
            rs = stmt.executeQuery("SELECT COUNT(username) AS total FROM users WHERE username = '" + username + "'");
            rs.next();
            if(rs.getInt("total")==0){
                return true;
            }
            return false;

        } catch (Exception e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
        } finally {
            stmt.close();
            con.close();
        }
        return false;
    }

    /**
     * Checks if an email is available (not already used in the consolidated users table).
     *
     * @param email The email to check
     * @return true if email is available, false if already exists
     * @throws SQLException
     * @throws ClassNotFoundException
     */
    public boolean isEmailAvailable(String email) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        try {
            // Check consolidated users table
            ResultSet rs = stmt.executeQuery("SELECT COUNT(email) AS total FROM users WHERE email = '" + email + "'");
            rs.next();
            if (rs.getInt("total") > 0) {
                return false;
            }

            return true;

        } catch (SQLException e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
            throw e;
        } finally {
            stmt.close();
            con.close();
        }
    }



}