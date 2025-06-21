package database.tables;

import com.google.gson.Gson;
import database.DB_Connection;

import java.sql.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.logging.Level;
import java.util.logging.Logger;
import mainClasses.Message;



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

            stmt.executeUpdate(insertQuery);
            System.out.println("# The message was successfully added in the database.");
            stmt.close();

        } catch (Exception ex) {
            Logger.getLogger(EditMessagesTable.class.getName()).log(Level.SEVERE, null, ex);
            throw new ClassNotFoundException("Error creating message: " + ex.getMessage());
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


    public ArrayList<Message> getPublicMessages() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ArrayList<Message> messages = new ArrayList<Message>();
        ResultSet rs;

        try {
            rs = stmt.executeQuery("SELECT * FROM messages WHERE recipient = 'public' ORDER BY date_time DESC");
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
            stmt.close();
            con.close();
        }
        return messages;
    }

    // public + volunteer only for specific incidents
    public ArrayList<Message> getMessagesForVolunteer(ArrayList<Integer> assignedIncidentIds) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        ArrayList<Message> messages = new ArrayList<Message>();

        String query = "SELECT * FROM messages WHERE recipient = 'public'";

        // Create placeholders for the IN clause
        String placeholders = String.join(",", Collections.nCopies(assignedIncidentIds.size(), "?"));
        query += " OR (recipient = 'volunteers' AND incident_id IN (" + placeholders + "))";

        query += " ORDER BY date_time DESC";

        PreparedStatement pstmt = con.prepareStatement(query);

        try {
            // Set parameters for the incident IDs
            if (assignedIncidentIds != null && !assignedIncidentIds.isEmpty()) {
                for (int i = 0; i < assignedIncidentIds.size(); i++) {
                    pstmt.setInt(i + 1, assignedIncidentIds.get(i));
                }
            }

            ResultSet rs = pstmt.executeQuery();
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
            pstmt.close();
            con.close();
        }
        return messages;
    }
}