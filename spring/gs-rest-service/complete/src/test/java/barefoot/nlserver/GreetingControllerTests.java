/*
 * Copyright 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package barefoot.nlserver;

import com.jayway.jsonpath.JsonPath;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import java.util.concurrent.CompletableFuture;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
public class GreetingControllerTests {

    public static final int ROUNDS_TO_PLAY = 2;
    @Autowired
    private MockMvc mockMvc;
    @Test
    public void startAndRunOneTurn() throws Exception {
        System.out.println("funkar");
    }
/*
    @Test
    public void startAndRunOneTurn() throws Exception {

        MvcResult startGame = this.mockMvc.perform(get("/startgame")).andDo(print()).andReturn();
        String response = startGame.getResponse().getContentAsString();
        String gameId = JsonPath.parse(response).read("$.id").toString();
        this.mockMvc.perform(get("/addplayer").param("playerid", "123")
                .param("gameid", gameId)).andDo(print()).andExpect(status().isOk()).andDo(
                MvcResult -> {
                    this.mockMvc.perform(get("/registerYield").param("playerid", "123")
                            .param("yield", "7")).andDo(print()).andExpect(status().isOk()).andDo(
                            MvcResult_ -> {
                                this.mockMvc.perform(get("/checkIfTurnIsFinnished").param("gameid", gameId)).andDo(print());
                            }
                    );
                }
        );

    }

    //Full game with 2 players
    int noOfPlayers = 2;

    @Test
    public void startAndRunFullGame() throws Exception {
        this.mockMvc.perform(get("/newgamegroup").param("passWord", "123"))
                .andDo(
                        nothing -> {
                            MvcResult startGame = this.mockMvc.perform(get("/startgame").param("passWord", "123")
                                    .param("rounds", Integer.toString(ROUNDS_TO_PLAY))).andDo(print()).andReturn();
                            String response = startGame.getResponse().getContentAsString();
                            String gameId = JsonPath.parse(response).read("$.id").toString();
                            for (int i = 0; i < noOfPlayers; i++) {
                                this.mockMvc.perform(get("/addplayer").param("passWord", "123")
                                        .param("playerid", "" + i)
                                        .param("gameid", gameId)).andDo(print()).andExpect(status().isOk()).andReturn();
                            }

                            for (int i = 0; i < ROUNDS_TO_PLAY; i++) {
                                for (int j = 0; j < noOfPlayers; j++)
                                    this.mockMvc.perform(get("/registerYield").param("passWord", "123")
                                            .param("playerid", "" + j)
                                            .param("yield", ""+(5+j))).andDo(print()).andExpect(status().isOk()).andReturn();
                                this.mockMvc.perform(get("/checkIfTurnIsFinnished").param("passWord", "123")
                                        .param("gameid", gameId)).andDo(print()).andReturn();
                            }
                            System.out.println("************GAMERESULT***********");
                            this.mockMvc.perform(get("/getGameResult").param("passWord", "123")
                                    .param("gameid", gameId)).andDo(print());

                            //);
                            //future.get();
                        });
    }
    */
}
