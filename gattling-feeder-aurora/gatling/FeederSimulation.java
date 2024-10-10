package simulation;

import io.gatling.javaapi.core.CoreDsl.*;
import io.gatling.javaapi.http.HttpDsl.*;
import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
import java.time.Duration;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

public class FeederSimulation extends Simulation {

    HttpProtocolBuilder httpProtocol = http
        .baseUrl("http://{IPアドレス}:3000")
        .acceptHeader("application/json");

    // 各CSVファイルをqueueモードで設定
    FeederBuilder.Batchable<String> feeder1 = csv("/home/ec2-user/gatling/src/test/java/csv/prefectures001.csv").queue();
    FeederBuilder.Batchable<String> feeder2 = csv("/home/ec2-user/gatling/src/test/java/csv/prefectures002.csv").queue();

    ScenarioBuilder scn1 = scenario("Scenario 1")
        .feed(feeder1)
        .exec(
            http("Request to API 1")
                .get("/feeder-test")
                .queryParam("prefecture", "#{prefecture}")
                .queryParam("prefectural_capital", "#{prefectural_capital}")
                .check(status().is(200))
        );

    ScenarioBuilder scn2 = scenario("Scenario 2")
        .feed(feeder2)
        .exec(
            http("Request to API 2")
                .get("/feeder-test")
                .queryParam("prefecture", "#{prefecture}")
                .queryParam("prefectural_capital", "#{prefectural_capital}")
                .check(status().is(200))
        );

    {
        setUp(
            scn1.injectOpen(constantUsersPerSec(1).during(Duration.ofSeconds(30))).andThen(
                scn2.injectOpen(constantUsersPerSec(1).during(Duration.ofSeconds(17)))
            )
        ).protocols(httpProtocol);
    }
}
