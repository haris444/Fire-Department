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

/**
 * Updated EditMessagesTable with new message rules:
 * - All messages must be tied to an incident
 * - Recipients can only be: "public", "volunteers", "admin"
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

    /**
     * Get messages for a specific incident
     */
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
     * Create new message - now requires incident_id
     */
    public void createNewMessage(Message msg) throws ClassNotFoundException {
        try {
            Connection con = DB_Connection.getConnection();
            Statement stmt = con.createStatement();

            // Validate required fields
            if (msg.getIncident_id() <= 0) {
                throw new IllegalArgumentException("Incident ID is required for all messages");
            }

            String recipient = msg.getRecipient();
            if (!"public".equals(recipient) && !"volunteers".equals(recipient) && !"admin".equals(recipient)) {
                throw new IllegalArgumentException("Recipient must be 'public', 'volunteers', or 'admin'");
            }

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

    /**
     * Get all messages - for admin use only
     */
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
     * Get public messages - for users and volunteers
     */
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

    /**
     * Get messages for volunteers - public messages and volunteer messages for assigned incidents
     */
    public ArrayList<Message> getMessagesForVolunteer(ArrayList<Integer> assignedIncidentIds) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ArrayList<Message> messages = new ArrayList<Message>();
        ResultSet rs;

        try {
            // Build query for public messages and volunteer messages for assigned incidents
            String query = "SELECT * FROM messages WHERE recipient = 'public'";

            if (assignedIncidentIds != null && !assignedIncidentIds.isEmpty()) {
                String incidentList = assignedIncidentIds.toString().replace("[", "(").replace("]", ")");
                query += " OR (recipient = 'volunteers' AND incident_id IN " + incidentList + ")";
            }

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
            stmt.close();
            con.close();
        }
        return messages;
    }
}