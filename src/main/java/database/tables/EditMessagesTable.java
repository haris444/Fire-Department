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
import java.util.ArrayList;
import java.util.logging.Level;
import java.util.logging.Logger;
import mainClasses.Message;
import mainClasses.Incident;

/**
 *
 * @author mountant
 */
public class EditMessagesTable {

    public void addMessageFromJSON(String json) throws ClassNotFoundException {
        Message msg = jsonToMessage(json);
        createNewMessage(msg);
    }

    public Message jsonToMessage(String json) {
        Gson gson = new Gson();
        Message msg = gson.fromJson(json, Message.class);
        msg.setDate_time();
        return msg;
    }

    public String messageToJSON(Message msg) {
        Gson gson = new Gson();

        String json = gson.toJson(msg, Message.class);
        return json;
    }

    public ArrayList<Message> databaseToMessage(int incident_id) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ArrayList<Message> messages = new ArrayList<Message>();
        ResultSet rs;
        try {
            rs = stmt.executeQuery("SELECT * FROM messages WHERE incident_id= '" + incident_id + "'");
            while (rs.next()) {
                String json = DB_Connection.getResultsToJSON(rs);
                Gson gson = new Gson();
                Message msg = gson.fromJson(json, Message.class);
                messages.add(msg);
            }
            return messages;
        } catch (Exception e) {
            System.err.println("Got an exception! ");

        }
        return null;
    }

    public void createMessageTable() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        String sql = "CREATE TABLE messages "
                + "(message_id INTEGER not NULL AUTO_INCREMENT, "
                + "incident_id INTEGER not NULL, "
                + "message VARCHAR(400) not NULL, "
                + "sender VARCHAR(50) not NULL, "
                + "recipient VARCHAR(50) not NULL, "
                + "date_time DATETIME  not NULL,"
                + "FOREIGN KEY (incident_id) REFERENCES incidents(incident_id), "
                + "PRIMARY KEY ( message_id ))";
        
        stmt.execute(sql);
        stmt.close();
        con.close();

    }

    /**
     * Establish a database connection and add in the database.
     *
     * @throws ClassNotFoundException
     */
    public void createNewMessage(Message msg) throws ClassNotFoundException {
        try {
            Connection con = DB_Connection.getConnection();

            Statement stmt = con.createStatement();

            String insertQuery = "INSERT INTO "
                    + " messages (incident_id,message,sender,recipient,date_time) "
                    + " VALUES ("
                    + "'" + msg.getIncident_id() + "',"
                    + "'" + msg.getMessage() + "',"
                    + "'" + msg.getSender() + "',"
                    + "'" + msg.getRecipient() + "',"
                    + "'" + msg.getDate_time() + "'"
                    + ")";
            //stmt.execute(table);
            System.out.println(insertQuery);
            stmt.executeUpdate(insertQuery);
            System.out.println("# The message was successfully added in the database.");

            /* Get the member id from the database and set it to the member */
            stmt.close();

        } catch (SQLException ex) {
            Logger.getLogger(EditMessagesTable.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    public ArrayList<Message> getAllMessages() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ArrayList<Message> messages = new ArrayList<Message>();
        ResultSet rs;
        try {
            rs = stmt.executeQuery("SELECT * FROM messages ORDER BY date_time DESC");
            while (rs.next()) {
                String json = DB_Connection.getResultsToJSON(rs);
                Gson gson = new Gson();
                Message msg = gson.fromJson(json, Message.class);
                messages.add(msg);
            }
            return messages;
        } catch (Exception e) {
            System.err.println("Got an exception! ");
        }
        return null;
    }

    /**
     * Fetches messages sent by a specific user.
     * @param username The username who sent the messages
     * @return ArrayList of messages sent by the user
     * @throws SQLException
     * @throws ClassNotFoundException
     */
    public ArrayList<Message> getMessagesSentByUser(String username) throws SQLException, ClassNotFoundException {
        Connection con = null;
        Statement stmt = null;
        ArrayList<Message> messages = new ArrayList<Message>();
        ResultSet rs;

        try {
            con = DB_Connection.getConnection();
            stmt = con.createStatement();

            String query = "SELECT * FROM messages WHERE sender = '" + username + "'";



            query += " ORDER BY date_time DESC";

            rs = stmt.executeQuery(query);
            while (rs.next()) {
                String json = DB_Connection.getResultsToJSON(rs);
                Gson gson = new Gson();
                Message msg = gson.fromJson(json, Message.class);
                messages.add(msg);
            }

        } catch (SQLException e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
            throw e;
        } finally {
            if (stmt != null) {
                stmt.close();
            }
            if (con != null) {
                con.close();
            }
        }

        return messages;
    }


    /**
     * Fetches all messages sent to a specific recipient.
     * @param recipient The recipient to fetch messages for (can be username or 'public')
     * @return ArrayList of messages sent to the recipient
     * @throws SQLException
     * @throws ClassNotFoundException
     */
    public ArrayList<Message> getMessagesByRecipient(String recipient) throws SQLException, ClassNotFoundException {
        Connection con = null;
        Statement stmt = null;
        ArrayList<Message> messages = new ArrayList<Message>();
        ResultSet rs;

        try {
            con = DB_Connection.getConnection();
            stmt = con.createStatement();

            String query = "SELECT * FROM messages WHERE recipient = '" + recipient + "' ORDER BY date_time DESC";

            rs = stmt.executeQuery(query);
            while (rs.next()) {
                String json = DB_Connection.getResultsToJSON(rs);
                Gson gson = new Gson();
                Message msg = gson.fromJson(json, Message.class);
                messages.add(msg);
            }

        } catch (SQLException e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
            throw e;
        } finally {
            if (stmt != null) {
                stmt.close();
            }
            if (con != null) {
                con.close();
            }
        }

        return messages;
    }

}
