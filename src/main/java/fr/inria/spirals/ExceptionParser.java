package fr.inria.spirals;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;

public class ExceptionParser {

	public static void main(String[] args) throws Exception {
		Server server = new Server(7070);
		ServletContextHandler handler = new ServletContextHandler(server, "/");
		handler.addServlet(ExceptionParserServlet.class, "/");
		server.start();
	}
}
