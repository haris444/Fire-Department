/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package database.tables;

import com.google.gson.Gson;
import database.DB_Connection;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import mainClasses.User;

/**
 *
 * @author micha
 */
public class CheckForDuplicatesExample {
    
    public boolean isUserNameAvailable(String username) throws SQLException, ClassNotFoundException{
         Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();

        ResultSet rs;
        try {
            rs = stmt.executeQuery("SELECT COUNT(username) AS total FROM users WHERE username = '" + username + "'");
            rs.next();
            if(rs.getInt("total")==0){
                 rs = stmt.executeQuery("SELECT COUNT(username) AS total2 FROM volunteers WHERE username = '" + username + "'");
                 rs.next();
                 if(rs.getInt("total2")==0){
                     return true;
                 }
             }
             return false;

        } catch (Exception e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
        }
    return false;
    }

    /**
     * Checks if an email is available (not already used in users or volunteers tables).
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
            // Check users table
            ResultSet rs = stmt.executeQuery("SELECT COUNT(email) AS total FROM users WHERE email = '" + email + "'");
            rs.next();
            if (rs.getInt("total") > 0) {
                return false;
            }

            // Check volunteers table
            rs = stmt.executeQuery("SELECT COUNT(email) AS total FROM volunteers WHERE email = '" + email + "'");
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
