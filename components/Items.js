/**
 * @file    Items.js
 * @author  Stephen Graham
 * @author  Evan Bacon, https://github.com/EvanBacon
 * @date    2023-03-17 
 * @brief   This class file defines an <Items> component that is crafted to be used by the sqlite demo code
*/
import React, { Component } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import * as SQLite from 'expo-sqlite';

/**
 * The Items component requires these props:
 *     db - sqlite db object
 *     done - boolean filter
 *     onPress - callback function
 * @todo enforce prop types via PropTypes from 'prop-types';
 */
class Items extends Component {
    constructor(props) {
        super(props);
        this.state = {
            items: null,
        }
    }

    /**
     * Update the state with selected items (from the database)
     * 
     * @fn setItems()
     * @param {array} items
     */
    setItems = (items) => {
        this.setState({ items: items });
    }

    /**
     * Called when an instance of <Items> mounts
     * Performs an update to put initial values in the items list from the database
     * 
     * @fn componentDidMount()
     * @see update()
     * @see setItems()
     */
    componentDidMount() {
        this.update();
    }

    /**
     * This will load the appropriate items from the provided database in this.props.db
     * 
     * @fn update()
     * @see setItems()
     */
    update = () => {
        this.props.db.transaction((tx) => {
            tx.executeSql(
                'select * from items where done = ?',
                [this.props.done ? 1 : 0],
                (_, { rows: { _array } }) => this.setItems(_array)
            )
        })
    }

    /**
     * This render function will only return something if there are items in the 
     * selected list (done or !done)
     * 
     * @fn render()
     */
    render() {
        if (this.state.items === null || this.state.items.length === 0) {
            return null;
        }

        let heading = this.props.done ? "Complete" : "To do";

        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>{heading}</Text>
                {this.state.items.map(({ id, done, value }) => (
                    <Pressable
                        key={id}
                        onPress={() => this.props.onPress && this.props.onPress(id)}
                        style={done ? styles.itemDone : styles.itemTodo}
                    >
                        <Text style={done ? styles.itemDoneText : styles.itemTodoText}>{value}</Text>
                    </Pressable>

                ))}
            </View>
        );
    }
} // end of Items component
export default Items;

const styles = StyleSheet.create({
    sectionContainer: {
        marginBottom: 16,
        marginHorizontal: 16,
    },
    sectionHeading: {
        fontSize: 18,
        marginBottom: 8,
    },
    itemTodo: {
        backgroundColor: "#fff",
        borderColor: "#000",
        borderWidth: 1,
        padding: 8,
    },
    itemTodoText: {
        color: "#000",
    },
    itemDone: {
        backgroundColor: 'green',
        borderColor: "#000",
        borderWidth: 1,
        padding: 8,
    },
    itemDoneText: {
        color: 'white',
    },

});