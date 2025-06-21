/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package database.tables;

import mainClasses.Incident;
import com.google.gson.Gson;
import database.DB_Connection;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author Mike
 */
public class EditIncidentsTable {

    public void addIncidentFromJSON(String json) throws ClassNotFoundException {
        Incident bt = jsonToIncident(json);
        if (bt.getStart_datetime()==null){
            bt.setStart_datetime();
        }
        createNewIncident(bt);
    }

    public Incident jsonToIncident(String json) {
        Gson gson = new Gson();
        Incident btest = gson.fromJson(json, Incident.class);
        return btest;
    }

    public String incidentToJSON(Incident bt) {
        Gson gson = new Gson();

        String json = gson.toJson(bt, Incident.class);
        return json;
    }

    public ArrayList<Incident> databaseToIncidents() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ArrayList<Incident> pets = new ArrayList<Incident>();
        ResultSet rs;
        try {
            rs = stmt.executeQuery("SELECT * FROM incidents");
            while (rs.next()) {
                String json = DB_Connection.getResultsToJSON(rs);
                Gson gson = new Gson();
                Incident pet = gson.fromJson(json, Incident.class);
                pets.add(pet);
            }
            return pets;

        } catch (Exception e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
        }
        return null;
    }



    public void updateIncident(String id, HashMap<String, String> updates) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();

        try (PreparedStatement stmt = con.prepareStatement(
                "UPDATE incidents SET incident_type = ?, description = ?, status = ?, danger = ?, vehicles = ? WHERE incident_id = ?")) {

            stmt.setString(1, updates.get("incident_type"));
            stmt.setString(2, updates.get("description"));
            stmt.setString(3, updates.get("status"));
            stmt.setString(4, updates.get("danger"));
            stmt.setString(5, updates.get("vehicles"));

            stmt.setString(6, id);
            stmt.executeUpdate();
        } finally {
            con.close();
        }
    }
    // Todo simplify update with one request


    public void deleteIncident(String id) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        String deleteQuery = "DELETE * FROM incidents WHERE incident_id='" + id + "'";
        stmt.executeUpdate(deleteQuery);
        stmt.close();
        con.close();
    }

    public void createIncidentsTable() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        String sql = "CREATE TABLE incidents "
                + "(incident_id INTEGER not NULL AUTO_INCREMENT, "
                + "incident_type VARCHAR(10) not null,"
                + "description VARCHAR(100) not null,"
                + "user_phone VARCHAR(14) not null,"
                + "user_type VARCHAR(10)  not null, "
                + "address VARCHAR(100) not null,"
                + "lat DOUBLE, "
                + "lon DOUBLE, "
                + "municipality VARCHAR(50),"
                + "prefecture VARCHAR(15),"
                + "start_datetime DATETIME not null , "
                + "end_datetime DATETIME DEFAULT null, "
                + "danger VARCHAR (15), "
                + "status VARCHAR (15), "
                + "finalResult VARCHAR (200), "
                + "vehicles INTEGER, "
                + "firemen INTEGER, "
                + "PRIMARY KEY (incident_id ))";
        stmt.execute(sql);
        stmt.close();
        con.close();
    }

    /**
     * Establish a database connection and add in the database.
     *
     * @throws ClassNotFoundException
     */
    public void createNewIncident(Incident bt) throws ClassNotFoundException {

        try {
            Connection con = DB_Connection.getConnection();

            Statement stmt = con.createStatement();

            String insertQuery = "INSERT INTO "
                    + " incidents (incident_id,incident_type,"
                    + "description,user_phone,user_type,"
                    + "address,lat,lon,municipality,prefecture,start_datetime,danger,status,"
                    + "finalResult,vehicles,firemen) "
                    + " VALUES ("
                    + "'" + bt.getIncident_id() + "',"
                    + "'" + bt.getIncident_type() + "',"
                    + "'" + bt.getDescription() + "',"
                    + "'" + bt.getUser_phone() + "',"
                    + "'" + bt.getUser_type() + "',"
                    + "'" + bt.getAddress() + "',"
                    + "'" + bt.getLat() + "',"
                    + "'" + bt.getLon() + "',"
                    + "'" + bt.getMunicipality() + "',"
                    + "'" + bt.getPrefecture() + "',"
                    + "'" + bt.getStart_datetime() + "',"
                    + "'" + bt.getDanger() + "',"
                    + "'" + bt.getStatus() + "',"
                    + "'" + bt.getFinalResult() + "',"
                    + "'" + bt.getVehicles() + "',"
                    + "'" + bt.getFiremen() + "'"
                    + ")";
            //stmt.execute(table);
            System.out.println(insertQuery);
            stmt.executeUpdate(insertQuery);
            System.out.println("# The incident was successfully added in the database.");

            /* Get the member id from the database and set it to the member */
            stmt.close();

        } catch (SQLException ex) {
            Logger.getLogger(EditIncidentsTable.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    /**
     * Count incidents by type for admin statistics.
     * @return ArrayList of HashMaps containing type and count
     * @throws SQLException
     * @throws ClassNotFoundException
     */
    public ArrayList<HashMap<String, Object>> countIncidentsByType() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ArrayList<HashMap<String, Object>> results = new ArrayList<HashMap<String, Object>>();
        ResultSet rs;

        try {
            rs = stmt.executeQuery("SELECT incident_type, COUNT(*) as count FROM incidents GROUP BY incident_type");
            while (rs.next()) {
                HashMap<String, Object> typeCount = new HashMap<String, Object>();
                typeCount.put("type", rs.getString("incident_type"));
                typeCount.put("count", rs.getInt("count"));
                results.add(typeCount);
            }
            return results;
        } catch (Exception e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
        } finally {
            stmt.close();
            con.close();
        }
        return null;
    }

    /**
     * Get total vehicles involved across all incidents.
     * @return Total number of vehicles
     * @throws SQLException
     * @throws ClassNotFoundException
     */
    public int getTotalVehiclesInvolved() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ResultSet rs;

        try {
            rs = stmt.executeQuery("SELECT SUM(vehicles) as total FROM incidents");
            if (rs.next()) {
                return rs.getInt("total");
            }
        } catch (Exception e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
        } finally {
            stmt.close();
            con.close();
        }
        return 0;
    }

    /**
     * Get total firemen involved across all incidents.
     * @return Total number of firemen
     * @throws SQLException
     * @throws ClassNotFoundException
     */
    public int getTotalFiremenInvolved() throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ResultSet rs;

        try {
            rs = stmt.executeQuery("SELECT SUM(firemen) as total FROM incidents");
            if (rs.next()) {
                return rs.getInt("total");
            }
        } catch (Exception e) {
            System.err.println("Got an exception! ");
            System.err.println(e.getMessage());
        } finally {
            stmt.close();
            con.close();
        }
        return 0;
    }

    public ArrayList<Incident> getIncidentsByIds(ArrayList<Integer> ids) throws SQLException, ClassNotFoundException {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ArrayList<Incident> incidents = new ArrayList<>();

        // Create a comma-separated string of IDs for the IN clause
        String idList = ids.toString().replace("[", "(").replace("]", ")");

        try {
            String query = "SELECT * FROM incidents WHERE incident_id IN " + idList;
            ResultSet rs = stmt.executeQuery(query);
            while (rs.next()) {
                String json = DB_Connection.getResultsToJSON(rs);
                Gson gson = new Gson();
                Incident incident = gson.fromJson(json, Incident.class);
                incidents.add(incident);
            }
        } finally {
            stmt.close();
            con.close();
        }
        return incidents;
    }

    public ArrayList<Incident> getIncidentsByVolunteerId(int volunteerUserId) throws SQLException, ClassNotFoundException {
        Connection con = DB_Connection.getConnection();
        Statement stmt = con.createStatement();
        ArrayList<Incident> incidents = new ArrayList<>();

        try {
            String query = "SELECT i.* FROM incidents i " +
                    "INNER JOIN volunteer_assignments va ON i.incident_id = va.incident_id " +
                    "WHERE va.volunteer_user_id = " + volunteerUserId;

            ResultSet rs = stmt.executeQuery(query);
            while (rs.next()) {
                String json = DB_Connection.getResultsToJSON(rs);
                Gson gson = new Gson();
                Incident incident = gson.fromJson(json, Incident.class);
                incidents.add(incident);
            }
        } finally {
            stmt.close();
            con.close();
        }
        return incidents;
    }

}