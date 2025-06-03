/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package database.init;

/**
 *
 * @author mountant
 */
public class Resources {

    static String admin = "{\"username\":\"admin\",\"email\":\"admin@e199.gr\","
            + "\"password\":\"admiN12@*\","
            + "\"firstname\":\"Admin\",\"lastname\":\"Adminakis\","
            + "\"birthdate\":\"1980-06-03\",\"gender\":\"Male\",\"afm\":\"1234554321\","
            + "\"country\":\"Greece\",\"address\":\"Pl. Kiprou 5, Iraklio 713 06\",\"municipality\":\"Heraklion\",\"prefecture\":\"Heraklion\",\"lat\":\"35.3332276\","
            + "\"lon\":\"25.1162213\",\"telephone\":\"2813407000\","
            + "\"job\":\"Firemen\"}";

    static String user1JSON = "{\"username\":\"mountanton\",\"email\":\"mike@csd.uoc.gr\",\"password\":\"ab$A12cde\","
            + "\"firstname\":\"Michalis\",\"lastname\":\"Mountantonakis\",\"birthdate\":\"1992-06-03\",\"gender\":\"Male\",\"afm\":\"1238585123\","
            + "\"country\":\"Greece\",\"address\":\"CSD Voutes\",\"municipality\":\"Heraklion\",\"prefecture\":\"Heraklion\",\"lat\":\"35.3053121\","
            + "\"lon\":\"25.0722869\",\"telephone\":\"1234567890\","
            + "\"job\":\"Researcher\"}";

    static String user2JSON = "{\"username\":\"tsitsip\",\"email\":\"tsitsipas@tuc.gr\",\"password\":\"ab$A12cde\","
            + "\"firstname\":\"Stefanos\",\"lastname\":\"Tsitsipas\",\"birthdate\":\"1998-08-12\",\"gender\":\"Male\",\"afm\":\"2525252525\","
            + "\"country\":\"Greece\",\"address\":\"Dimokratias 99\",\"municipality\":\"Heraklion\",\"prefecture\":\"Heraklion\",\"lat\":\"35.3401097\","
            + "\"lon\":\"25.1562301\",\"telephone\":\"6911111122\","
            + "\"job\":\"Twitter/Tennis\"}";

    static String user3JSON = "{\"username\":\"csdasbest\",\"email\":\"csdas@uoc.gr\",\"password\":\"ab$A12cde\","
            + "\"firstname\":\"Mary\",\"lastname\":\"Tsipaki\",\"birthdate\":\"1981-11-12\",\"gender\":\"Female\",\"afm\":\"1579991110\","
            + "\"country\":\"Greece\",\"address\":\"Limenas Chersonisou\",\"municipality\":\"Hersonissos\",\"prefecture\":\"Heraklion\",\"lat\":\"35.318761\","
            + "\"lon\":\"25.3715371\",\"telephone\":\"6977889900\","
            + "\"job\":\"compilers project manager\"}";
    
    static String user4JSON = "{\"username\":\"tympaki\",\"email\":\"tympakianos@uoc.gr\",\"password\":\"ab$A12cde\","
            + "\"firstname\":\"Georgos\",\"lastname\":\"Niktaris\",\"birthdate\":\"2003-07-12\",\"gender\":\"Male\",\"afm\":\"1179991110\","
            + "\"country\":\"Greece\",\"address\":\"I. Koriotaki\",\"municipality\":\"Faistos\",\"prefecture\":\"Heraklion\",\"lat\":\"35.0722851\","
            + "\"lon\":\"24.7588403\",\"telephone\":\"6977880000\","
            + "\"job\":\"farmer\"}";
    
    
    static String volunteer1JSON = "{\"username\":\"raphael\",\"email\":\"raphael@gmail.gr\",\"password\":\"ab$A12cde\","
            + "\"firstname\":\"Raphael\",\"lastname\":\"Papadopoulos\",\"birthdate\":\"1992-08-12\",\"gender\":\"Male\",\"afm\":\"1234567891\","
            + "\"country\":\"Greece\",\"address\":\"El. Venizelou 160, Malia\",\"municipality\":\"Hersonissos\",\"prefecture\":\"Heraklion\",\"lat\":\"35.2836391\","
            + "\"lon\":\"25.4600817\",\"telephone\":\"6988877755\","
            + "\"job\":\"taxi driver\",\"volunteer_type\":\"driver\",\"height\":\"1.80\",\"weight\":\"90.0\"}";

    static String volunteer2JSON = "{\"username\":\"nick\",\"email\":\"nick@gmail.gr\",\"password\":\"ab$A12cde\","
            + "\"firstname\":\"Nick\",\"lastname\":\"Georgakopoulos\",\"birthdate\":\"1988-08-12\",\"gender\":\"Male\",\"afm\":\"1234567891\","
            + "\"country\":\"Greece\",\"address\":\"Evans 124\",\"municipality\":\"Heraklion\",\"prefecture\":\"Heraklion\",\"lat\":\"35.2976896\","
            + "\"lon\":\"25.0806272\",\"telephone\":\"6978912345\","
            + "\"job\":\"barista\",\"volunteer_type\":\"simple\",\"height\":\"1.99\",\"weight\":\"112.5\"}";

    static String volunteer3JSON = "{\"username\":\"mary\",\"email\":\"mary@gmail.gr\",\"password\":\"ab$A12cde\","
            + "\"firstname\":\"Maria\",\"lastname\":\"Vlahaki\",\"birthdate\":\"1992-11-12\",\"gender\":\"Male\",\"afm\":\"8882223335\","
            + "\"country\":\"Greece\",\"address\":\"Stalida\",\"municipality\":\"Hersonissos\",\"prefecture\":\"Heraklion\",\"lat\":\"35.2908868\","
            + "\"lon\":\"25.4600817\",\"telephone\":\"6977777777\","
            + "\"job\":\"receptionist\",\"volunteer_type\":\"simple\",\"height\":\"1.70\",\"weight\":\"60.0\"}";

    static String volunteer4JSON = "{\"username\":\"papas\",\"email\":\"papas@gmail.gr\",\"password\":\"ab$A12cde\","
            + "\"firstname\":\"Mike\",\"lastname\":\"Pappas\",\"birthdate\":\"1978-08-12\",\"gender\":\"Male\",\"afm\":\"7899991112\","
            + "\"country\":\"Greece\",\"address\":\"Kondylaki 88\",\"municipality\":\"Heraklion\",\"prefecture\":\"Heraklion\",\"lat\":\"35.3295412\","
            + "\"lon\":\"25.1185202\",\"telephone\":\"6991234567\","
            + "\"job\":\"dikigoros\",\"volunteer_type\":\"driver\",\"height\":\"1.69\",\"weight\":\"78.5\"}";

    
    static String incident1 = "{\"incident_type\":\"fire\","
            + "\"description\":\"Fotia konta stis voutes\","
            + "\"user_phone\":\"2813407000\","
            + "\"user_type\":\"admin\","
            + "\"address\":\"Leof. Panepistimiou 121\","
            + "\"lat\":\"35.2975689\","
            + "\"lon\":\"25.0787173\","
            + "\"municipality\":\"Heraklion\","
            + "\"prefecture\":\"Heraklion\","
            + "\"status\":\"running\","
            + "\"danger\":\"high\"}";

    static String incident2 = "{\"incident_type\":\"accident\","
            + "\"description\":\"Atuxima me 2 gourounes\","
            + "\"user_phone\":\"6977141414\","
            + "\"user_type\":\"guest\","
            + "\"address\":\"El. Venizelou 170\","
            + "\"start_datetime\":\"2024-10-10 15:40:05\","
            + "\"status\":\"submitted\","
            + "\"danger\":\"unknown\"}";

    static String incident3 = "{\"incident_type\":\"fire\","
            + "\"description\":\"Fotia se mi katoikimeni perioxi\","
            + "\"user_phone\":\"6977142314\","
            + "\"user_type\":\"guest\","
            + "\"address\":\"Archanes-Asterousia 70100\","
            + "\"start_datetime\":\"2024-10-10 15:50:05\","
            + "\"status\":\"submitted\","
            + "\"danger\":\"unknown\"}";

    
    static String incident4 = "{\"incident_type\":\"accident\","
            + "\"description\":\"Atuxima me fortigo\","
            + "\"user_phone\":\"6978912345\","
            + "\"user_type\":\"user\","
            + "\"address\":\"Archanes-Asterousia 70100\","
            + "\"start_datetime\":\"2024-08-08 10:50:05\","
            + "\"status\":\"submitted\","
            + "\"danger\":\"unknown\"}";

     static String incident5 = "{\"incident_type\":\"accident\","
            + "\"description\":\"Atuxima me autokinita\","
            + "\"user_phone\":\"2813407000\","
            + "\"user_type\":\"admin\","
            + "\"address\":\"Leof. Knossou 17\","
            + "\"lat\":\"35.331356\","
            + "\"lon\":\"25.133087\","
            + "\"municipality\":\"Heraklion\","
            + "\"prefecture\":\"Heraklion\","
            + "\"status\":\"running\","
            + "\"danger\":\"low\"}";
    
    
    static String participant1 = "{\"incident_id\":\"1\","
            + "\"volunteer_type\":\"simple\","
            + "\"status\":\"requested\"}";

    static String participant2 = "{\"incident_id\":\"1\","
            + "\"volunteer_type\":\"driver\","
            + "\"status\":\"requested\"}";

    static String participant3 = "{\"incident_id\":\"3\","
            + "\"volunteer_type\":\"driver\","
            + "\"status\":\"requested\"}";

    
    static String message1 = "{\"incident_id\":\"1\","
            + "\"message\":\"Min plisiazetai tin perioxi, dromos kleistos\","
            + "\"sender\":\"admin\"," + "\"recipient\":\"public\"}";

    static String message2 = "{\"incident_id\":\"1\","
            + "\"message\":\"Uparxei kindunos me ladia\","
            + "\"sender\":\"raphael\"," + "\"recipient\":\"public\"}";
}
