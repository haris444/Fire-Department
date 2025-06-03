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

}
