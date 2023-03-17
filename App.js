/**
 * @file    App.js
 * @author  Stephen Graham
 * @author  Evan Bacon, https://github.com/EvanBacon
 * @date    2023-03-17 
 * @brief   This app demonstrates some expo-sqlite features
 */
import React, { Component } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Constants from 'expo-constants';
import * as SQLite from 'expo-sqlite';
import Items from './components/Items';

/**
 *
 * This function will return an SQLite object
 * If the detected platform is 'web' then the object will be minimally functional, but empty
 * Otherwise, open a database, creating it if it doesn't exist, and return a Database object. 
 *   On disk, the database will be created under the app's documents directory, 
 *   i.e. ${FileSystem.documentDirectory}/SQLite/${name}.
 */
function openDatabase(){
    if (Platform.OS === 'web') {
        return {
            transaction: () => {
                return {
                    executeSql: () => { }
                }
            }
        }
    }
    const db = SQLite.openDatabase('db1.db');
    return db;
}

const db = openDatabase(); /// Global variable container for the opened SQLite database object

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            text: null,
        }
    }

    /**
    * This helper function updates the value of this.state.text
    * 
    * @fn setText()
    * @param {string} text The text to be updated in the state
    */
    setText = (text) => {
        this.setState({ text: text });
    } 

    /**
     * This will create the table in the open database if it does not exist
     * Note that the integer keyword must be fully specified for the primary key
     * See: https://stackoverflow.com/questions/7337882/what-is-the-difference-between-sqlite-integer-data-types-like-int-integer-bigi
     */
    componentDidMount() {
        db.transaction(
            (tx) => {
                tx.executeSql(
                    "create table if not exists items (id integer primary key not null, done int, value text);",
                    [],
                    null,
                    (err) => console.log(err)
                )
            },
            (err) => console.log(err)
        );
    }

     /**
     * If a non-empty string is provided, this function will insert the text into the items table
     * marked as not done (i.e. done=0)
     * 
     * As a side-effect, we are loging the contents of the database to the console.
     * 
     * @fn add()
     * @param {string} text the value to be inserted in the database
     * @see update()
     */
    add = (text) => {
        if (text === null || text === '') {
            return false;
        }


        /*
         * db.transaction takes 3 arguments:
         *    a SQLTransactionCallback representing the transaction to perform takes a Transaction as its only parameter
         *    a SQLTransactionErrorCallback to be called if there was an error. takes a single error parameter
         *    (optional) Success callback that will be called when the transaction is successful.
         * 
         *  tx.executeSQL method takes 4 arguments:
         *   sqlStatiment - string of the SQL statement to be executed. may contain ? placeholders to be replaced by args
         *   args - optional an array of values to replace ? placeholders.
         *   callback - SQLStatementCallback that is called when the query is successful. 
         *              Takes two parameters, the Transaction and a ResultSet
         *   errorCallback - SQLStatementErrorCallback that is called when the query throws an error
         *                   Takes two parameters, the Transaction and the error object
         */
        db.transaction(
            (tx) => {
                tx.executeSql(
                    "insert into items (done, value) values (0, ?)",
                    [text]
                );
                tx.executeSql(
                    "select * from items",
                    [],
                    (_, { rows }) => console.log(JSON.stringify(rows))
                );
            },
            (err)=>console.log(err),
            this.update
        )
    }

    /**
   * in our render() we have two <Items> each of which will generate a reference with a callback function
   *    <Items ref={todo => (this.todo = todo)} />
   *    <Items ref={done => (this.done = done)} />
   * The reference will assign a `reference` to the specific object to a named variable in this
   * In other words, this.todo will refer to the <Items> object with the todo ref 
   * This update function will call the update of each of the referenced objects
   * 
   * <Items> is defined in ./components/Items.js
   * 
   * @fn update()
   */
    update = () => {
        this.todo && this.todo.update();
        this.done && this.done.update();
    }

    /**
     * Either return a warning that Expo SQLite is not supported on the web
     * or return the data entry and data display components
     * 
     * @fn render()
     * @see add()
     * @see update()
     */
    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.heading}>SQLite Todo Example</Text>
                {/* protect against Platform.OS==='web' */
                Platform.OS === 'web' ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={styles.heading}> Expo SQLite is not supported on the web!</Text>
                    </View>
                    ) : (
                    <>
                        <StatusBar />
                        <View style={styles.flexRow}>
                            <TextInput
                                onChangeText={text => this.setText(text)}
                                onSubmitEditing={() => {
                                    this.add(this.state.text);
                                    this.setText(null);
                                }}
                                placeholder="what do you need to do?"
                                style={styles.input}
                                value={this.state.text}
                            />
                        </View>
                        <ScrollView style={styles.listArea}>
                            <Items
                                ref={todo => (this.todo = todo)}
                                db={db}
                                done={false}
                                onPress={(id) => {
                                    db.transaction(
                                        (tx) => {
                                            tx.executeSql(
                                                "update items set done = 1 where id = ?",
                                                [id]
                                            )
                                        },
                                        (err) => console.log(err),
                                        this.update
                                    )
                                }
                                }
                            />
                            <Items
                                ref={done => (this.done = done)}
                                db={db}
                                done={true}
                                onPress={(id) => {
                                    db.transaction((tx) => {
                                        tx.executeSql(
                                            "delete from items where id = ?",
                                            [id]
                                        )
                                        },
                                        (err) => console.log(err),
                                        this.update
                                    )
                                }}
                            />
                        </ScrollView>
                    </>
                )
                }
            </View>
        );
    }
} // end of class App

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  flexRow: {
    flexDirection: 'row',
  },
  input: {
    borderColor: 'lightblue',
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    height: 48,
    margin: 16,
    padding: 8,
  },
  listArea: {
    backgroundColor: 'lightgrey',
    flex: 1,
    paddingTop: 16,
  },
});