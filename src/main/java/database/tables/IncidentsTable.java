package database.tables;

import mainClasses.Incident;
import com.google.gson.Gson;
import database.DB_Connection;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;


public class IncidentsTable {

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


    public ArrayList<Incident> getAllIncidents() throws SQLException, ClassNotFoundException {
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


    public void createNewIncident(Incident bt) throws ClassNotFoundException {

        try {
            Connection con = DB_Connection.getConnection();

            String insertQuery = "INSERT INTO incidents (incident_id,incident_type,description,user_phone,user_type,address,lat,lon,municipality,prefecture,start_datetime,danger,status,finalResult,vehicles,firemen) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

            PreparedStatement pstmt = con.prepareStatement(insertQuery);

            pstmt.setInt(1, bt.getIncident_id());
            pstmt.setString(2, bt.getIncident_type());
            pstmt.setString(3, bt.getDescription());
            pstmt.setString(4, bt.getUser_phone());
            pstmt.setString(5, bt.getUser_type());
            pstmt.setString(6, bt.getAddress());
            pstmt.setObject(7, bt.getLat());
            pstmt.setObject(8, bt.getLon());
            pstmt.setString(9, bt.getMunicipality());
            pstmt.setString(10, bt.getPrefecture());
            pstmt.setString(11, bt.getStart_datetime());
            pstmt.setString(12, bt.getDanger());
            pstmt.setString(13, bt.getStatus());
            pstmt.setString(14, bt.getFinalResult());
            pstmt.setObject(15, bt.getVehicles());
            pstmt.setObject(16, bt.getFiremen());

            pstmt.executeUpdate();
            System.out.println("# The incident was successfully added in the database.");

            pstmt.close();

        } catch (SQLException ex) {
            System.err.println("Got an exception! ");
            System.err.println(ex.getMessage());        }
    }


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