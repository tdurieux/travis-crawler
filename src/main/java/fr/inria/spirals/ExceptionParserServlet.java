package fr.inria.spirals;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import exceptionparser.StackTrace;
import exceptionparser.StackTraceParser;
import org.eclipse.jetty.http.HttpStatus;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Scanner;

public class ExceptionParserServlet extends HttpServlet {

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		Scanner s = new Scanner(req.getInputStream(), "UTF-8").useDelimiter("\\A");
		String body = s.hasNext() ? s.next() : "";
		List<StackTrace> stackTraces = StackTraceParser.parseAll(body);
		GsonBuilder builder = new GsonBuilder();
		Gson gson = builder.create();
		resp.setStatus(HttpStatus.OK_200);
		resp.setContentType("application/json");
		resp.getWriter().println(gson.toJson(stackTraces));
	}
}
